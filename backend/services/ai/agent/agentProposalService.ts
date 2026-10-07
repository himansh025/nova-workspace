import crypto from "crypto";
import { AgentRunModel } from "../../../models/AgentRun";
import {
  AgentChangeProposalModel,
  ProposalTool,
} from "../../../models/AgentChangeProposal";
import { agentAuditService } from "./agentAuditService";
import {
  applyWorkspacePatch,
  deleteWorkspaceFile,
  readWorkspaceFile,
  renameWorkspaceFile,
  writeWorkspaceFile,
} from "./agentWorkspaceService";
import { mergeDiffSummary, computeFileDiff, type IDiffSummary } from "./agentDiffService";
import { redactSecrets } from "../secretRedactor";

export const agentProposalService = {
  async createProposal(params: {
    runId: string;
    organizationId: string;
    userId: string;
    tool: ProposalTool;
    path: string;
    targetPath?: string;
    payload: Record<string, unknown>;
    diffPreview: string;
    linesAdded: number;
    linesRemoved: number;
    autonomousMode: boolean;
  }) {
    const run = await AgentRunModel.findOne({
      id: params.runId,
      organizationId: params.organizationId,
      userId: params.userId,
    });
    if (!run) throw new Error("Agent run not found.");

    const proposalId = `prop-${crypto.randomUUID()}`;
    const proposal = await AgentChangeProposalModel.create({
      id: proposalId,
      agentRunId: params.runId,
      organizationId: params.organizationId,
      userId: params.userId,
      tool: params.tool,
      path: params.path,
      targetPath: params.targetPath,
      payload: params.payload,
      status: params.autonomousMode ? "APPROVED" : "PENDING",
      linesAdded: params.linesAdded,
      linesRemoved: params.linesRemoved,
      diffPreview: redactSecrets(params.diffPreview).slice(0, 8000),
    });

    await agentAuditService.record({
      agentRunId: params.runId,
      organizationId: params.organizationId,
      userId: params.userId,
      tool: params.tool,
      path: params.path,
      input: params.payload,
      output: {
        proposalId,
        status: proposal.status,
        linesAdded: params.linesAdded,
        linesRemoved: params.linesRemoved,
      },
    });

    if (params.autonomousMode) {
      await this.applyProposalInternal(proposalId, params.organizationId, params.userId);
      return { proposalId, status: "APPLIED", requiresApproval: false };
    }

    run.status = "WAITING";
    run.waitingForProposalId = proposalId;
    run.loopPhase = "REVIEW";
    await run.save();

    return {
      proposalId,
      status: "PENDING",
      requiresApproval: true,
      diffPreview: proposal.diffPreview,
      linesAdded: params.linesAdded,
      linesRemoved: params.linesRemoved,
    };
  },

  async listProposals(organizationId: string, userId: string, runId: string) {
    return AgentChangeProposalModel.find({
      agentRunId: runId,
      organizationId,
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();
  },

  async approveProposal(organizationId: string, userId: string, runId: string, proposalId: string) {
    return this.applyProposalInternal(proposalId, organizationId, userId);
  },

  async rejectProposal(organizationId: string, userId: string, runId: string, proposalId: string) {
    const proposal = await AgentChangeProposalModel.findOne({
      id: proposalId,
      agentRunId: runId,
      organizationId,
      userId,
    });
    if (!proposal) throw new Error("Proposal not found.");
    proposal.status = "REJECTED";
    await proposal.save();
    return proposal;
  },

  async clearWaitingState(runId: string, organizationId: string, userId: string) {
    const run = await AgentRunModel.findOne({ id: runId, organizationId, userId });
    if (!run) return;
    if (run.status === "WAITING") {
      run.status = "ANALYZING";
      run.waitingForProposalId = undefined;
      run.loopPhase = "EDIT";
      await run.save();
    }
  },

  async applyProposalInternal(proposalId: string, organizationId: string, userId: string) {
    const proposal = await AgentChangeProposalModel.findOne({
      id: proposalId,
      organizationId,
      userId,
    });
    if (!proposal) {
      const err = new Error("Proposal not found.") as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    if (proposal.status === "APPLIED") return proposal;
    if (proposal.status === "REJECTED" || proposal.status === "CANCELLED") {
      throw new Error("Proposal cannot be applied.");
    }

    const runId = proposal.agentRunId;
    let summary: IDiffSummary | null = null;
    let appliedPath = proposal.path;

    switch (proposal.tool) {
      case "write_file": {
        const content = String(proposal.payload.content || "");
        const r = await writeWorkspaceFile(runId, proposal.path, content, {
          allowFullReplace: Boolean(proposal.payload.allowFullReplace),
        });
        summary = r.summary;
        break;
      }
      case "apply_patch": {
        const patch = String(proposal.payload.patch || "");
        const r = await applyWorkspacePatch(runId, proposal.path, patch);
        summary = r.summary;
        break;
      }
      case "delete_file": {
        const r = await deleteWorkspaceFile(runId, proposal.path);
        summary = r.summary;
        break;
      }
      case "rename_file": {
        const to = String(proposal.targetPath || proposal.payload.toPath || "");
        const r = await renameWorkspaceFile(runId, proposal.path, to);
        summary = r.summary;
        appliedPath = to;
        break;
      }
      default:
        throw new Error("Unknown proposal tool.");
    }

    proposal.status = "APPLIED";
    await proposal.save();

    const run = await AgentRunModel.findOne({ id: runId });
    if (run && summary) {
      const prev = run.diffSummary || {
        filesAdded: 0,
        filesModified: 0,
        filesDeleted: 0,
        linesAdded: 0,
        linesRemoved: 0,
      };
      run.diffSummary = mergeDiffSummary(prev as IDiffSummary, summary);
      if (!run.modifiedFiles.includes(appliedPath)) {
        run.modifiedFiles.push(appliedPath);
      }
      run.loopPhase = "DIFF";
      await run.save();
    }

    await agentAuditService.record({
      agentRunId: runId,
      organizationId,
      userId,
      tool: `${proposal.tool}:applied`,
      path: appliedPath,
      input: { proposalId },
      output: summary,
    });

    return proposal;
  },

  async previewPatch(runId: string, path: string, patch: string) {
    const { applyUnifiedPatch } = await import("./agentPatchUtils");
    const prior = await readWorkspaceFile(runId, path);
    const before = prior.exists ? prior.content || "" : "";
    const after = applyUnifiedPatch(before, patch);
    return computeFileDiff(path, before, after);
  },
};
