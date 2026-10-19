import { z } from "zod";
import { AGENT_CONFIG } from "./agentConfig";
import { validateAgentFilePath, sliceFileContent } from "./agentPathUtils";
import type { IAgentToolContext, IAgentToolDefinition } from "./agentTypes";
import { readWorkspaceFile } from "./agentWorkspaceService";
import { agentProposalService } from "./agentProposalService";
import { computeFileDiff } from "./agentDiffService";
import { agentAuditService } from "./agentAuditService";

function bound(data: unknown, max = AGENT_CONFIG.maxToolOutputChars): unknown {
  const s = JSON.stringify(data);
  if (s.length <= max) return data;
  return { truncated: true, preview: s.slice(0, max) };
}

function requireRun(ctx: IAgentToolContext): void {
  if (!ctx.runId) throw new Error("Agent run context is required for write tools.");
}

const writeFileSchema = z.object({
  path: z.string(),
  content: z.string().max(AGENT_CONFIG.workspaceMaxFileBytes),
  allowFullReplace: z.boolean().optional(),
});

const patchSchema = z.object({
  path: z.string(),
  patch: z.string().max(AGENT_CONFIG.maxPatchChars),
});

const deleteSchema = z.object({ path: z.string() });

const renameSchema = z.object({
  fromPath: z.string(),
  toPath: z.string(),
});

export const writeTools: IAgentToolDefinition[] = [
  {
    name: "apply_patch",
    description:
      "Apply a unified diff or <<<SEARCH/===REPLACE>>> patch to a file in the isolated workspace (preferred over write_file).",
    inputSchema: {
      type: "object",
      required: ["path", "patch"],
      properties: { path: { type: "string" }, patch: { type: "string" } },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx, input) {
      const parsed = patchSchema.parse(input);
      const path = validateAgentFilePath(parsed.path);
      const preview = await agentProposalService.previewPatch(ctx.runId!, path, parsed.patch);
      const result = await agentProposalService.createProposal({
        runId: ctx.runId!,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: "apply_patch",
        path,
        payload: { patch: parsed.patch },
        diffPreview: preview.fileDiff.unifiedDiff,
        linesAdded: preview.fileDiff.linesAdded,
        linesRemoved: preview.fileDiff.linesRemoved,
        autonomousMode: Boolean(ctx.autonomousMode),
      });
      return bound(result);
    },
  },
  {
    name: "write_file",
    description:
      "Write a file in the workspace. For existing files prefer apply_patch; full replace only for new/small files.",
    inputSchema: {
      type: "object",
      required: ["path", "content"],
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        allowFullReplace: { type: "boolean" },
      },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx, input) {
      const parsed = writeFileSchema.parse(input);
      const path = validateAgentFilePath(parsed.path);
      const prior = await readWorkspaceFile(ctx.runId!, path);
      const before = prior.exists ? prior.content || "" : "";
      const preview = computeFileDiff(path, before, parsed.content);
      const result = await agentProposalService.createProposal({
        runId: ctx.runId!,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: "write_file",
        path,
        payload: {
          content: parsed.content,
          allowFullReplace: parsed.allowFullReplace ?? !prior.exists,
        },
        diffPreview: preview.fileDiff.unifiedDiff,
        linesAdded: preview.fileDiff.linesAdded,
        linesRemoved: preview.fileDiff.linesRemoved,
        autonomousMode: Boolean(ctx.autonomousMode),
      });
      return bound(result);
    },
  },
  {
    name: "delete_file",
    description: "Delete a file inside the isolated workspace.",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: { path: { type: "string" } },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx, input) {
      const parsed = deleteSchema.parse(input);
      const path = validateAgentFilePath(parsed.path);
      const prior = await readWorkspaceFile(ctx.runId!, path);
      const preview = computeFileDiff(path, prior.content || "", "");
      const result = await agentProposalService.createProposal({
        runId: ctx.runId!,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: "delete_file",
        path,
        payload: {},
        diffPreview: preview.fileDiff.unifiedDiff,
        linesAdded: 0,
        linesRemoved: preview.fileDiff.linesRemoved,
        autonomousMode: Boolean(ctx.autonomousMode),
      });
      return bound(result);
    },
  },
  {
    name: "rename_file",
    description: "Rename or move a file within the workspace.",
    inputSchema: {
      type: "object",
      required: ["fromPath", "toPath"],
      properties: { fromPath: { type: "string" }, toPath: { type: "string" } },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx, input) {
      const parsed = renameSchema.parse(input);
      const fromPath = validateAgentFilePath(parsed.fromPath);
      const toPath = validateAgentFilePath(parsed.toPath);
      const result = await agentProposalService.createProposal({
        runId: ctx.runId!,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: "rename_file",
        path: fromPath,
        targetPath: toPath,
        payload: { toPath },
        diffPreview: `rename from ${fromPath}\nrename to ${toPath}`,
        linesAdded: 0,
        linesRemoved: 0,
        autonomousMode: Boolean(ctx.autonomousMode),
      });
      return bound(result);
    },
  },
  {
    name: "get_workspace_diff",
    description: "Get compact diff summary of workspace changes vs baseline.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx) {
      const { collectWorkspaceDiff } = await import("./agentWorkspaceService");
      const summary = await collectWorkspaceDiff(ctx.runId!);
      await agentAuditService.record({
        agentRunId: ctx.runId!,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: "get_workspace_diff",
        input: {},
        output: {
          linesAdded: summary.linesAdded,
          linesRemoved: summary.linesRemoved,
          files: summary.fileDiffs.map((f) => f.path),
        },
      });
      return bound({
        ...summary,
        fileDiffs: summary.fileDiffs.map((f) => ({
          path: f.path,
          status: f.status,
          linesAdded: f.linesAdded,
          linesRemoved: f.linesRemoved,
        })),
      });
    },
  },
];
