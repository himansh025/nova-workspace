import crypto from "crypto";
import { AgentRunModel, IAgentRunDocument } from "../../../models/AgentRun";
import { AGENT_CONFIG } from "./agentConfig";
import {
  AGENT_SYSTEM_INSTRUCTION,
  buildAgentDecisionPrompt,
  buildFinalExplanationPrompt,
  buildPlanningPrompt,
} from "./agentPrompts";
import type { IAgentDecision, IAgentTokenUsage, IPlanningResult, IPlanStep } from "./agentTypes";
import { modelRouter } from "./modelRouter";
import { repositoryContextManager } from "./repositoryContextManager";
import {
  executeAgentTool,
  formatToolCatalogForPrompt,
} from "./toolRegistry";

const activeRunAbort = new Map<string, { cancelled: boolean }>();
const runModelById = new Map<string, string | undefined>();

function parseJsonFromModel<T>(text: string): T {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return valid JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}

function mergeTokenUsage(
  current: IAgentTokenUsage,
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  extras?: { toolCalls?: number; iterations?: number }
): IAgentTokenUsage {
  return {
    inputTokens: current.inputTokens + (usage?.promptTokens || 0),
    outputTokens: current.outputTokens + (usage?.completionTokens || 0),
    totalTokens: current.totalTokens + (usage?.totalTokens || 0),
    toolCalls: current.toolCalls + (extras?.toolCalls || 0),
    iterations: current.iterations + (extras?.iterations || 0),
  };
}

function compactStateForPrompt(run: IAgentRunDocument, toolDigest: string): string {
  const pending = run.plan.filter((s) => s.status === "PENDING" || s.status === "IN_PROGRESS");
  const completed = run.plan
    .filter((s) => s.status === "COMPLETED")
    .map((s) => ({ id: s.id, description: s.description, result: s.result?.slice(0, 400) }));

  return JSON.stringify(
    {
      status: run.status,
      iterationCount: run.iterationCount,
      currentStep: run.currentStep,
      relevantFiles: run.relevantFiles.slice(0, 20),
      modifiedFiles: run.modifiedFiles.slice(0, 20),
      loopPhase: run.loopPhase,
      diffSummary: run.diffSummary,
      pendingSteps: pending.map((s) => ({ id: s.id, description: s.description })),
      completedSteps: completed,
      recentToolResults: toolDigest.slice(0, 3000),
      recentDiffs: toolDigest.includes("get_workspace_diff") ? "see tool results" : undefined,
    },
    null,
    0
  );
}

export class AgentOrchestrator {
  async startRun(params: {
    organizationId: string;
    userId: string;
    repositoryId: string;
    task: string;
    branch?: string;
    model?: string;
    enableEdits?: boolean;
    editMode?: "approval" | "autonomous";
    autonomousMode?: boolean;
  }): Promise<IAgentRunDocument> {
    const id = `agent-${crypto.randomUUID()}`;
    const enableEdits = params.enableEdits !== false;
    const editMode =
      params.editMode ||
      (params.autonomousMode || AGENT_CONFIG.defaultAutonomousMode ? "autonomous" : "approval");
    const run = await AgentRunModel.create({
      id,
      organizationId: params.organizationId,
      userId: params.userId,
      repositoryId: params.repositoryId,
      branch: params.branch,
      task: params.task.trim(),
      status: "PLANNING",
      loopPhase: "PLAN",
      plan: [],
      discoveredFiles: [],
      relevantFiles: [],
      modifiedFiles: [],
      iterationCount: 0,
      enableEdits,
      editMode,
      workspaceInitialized: false,
      tokenUsage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        toolCalls: 0,
        iterations: 0,
      },
    });

    activeRunAbort.set(id, { cancelled: false });
    runModelById.set(id, params.model);
    setImmediate(() => {
      this.executeRun(id, params.model).catch((err) => {
        console.error(`[AgentOrchestrator] Run ${id} failed:`, err);
      });
    });

    return run;
  }

  async cancelRun(organizationId: string, userId: string, runId: string): Promise<boolean> {
    const run = await AgentRunModel.findOne({ id: runId, organizationId, userId });
    if (!run) return false;
    if (run.status === "COMPLETED" || run.status === "FAILED" || run.status === "CANCELLED") {
      return true;
    }
    const flag = activeRunAbort.get(runId);
    if (flag) flag.cancelled = true;
    run.status = "CANCELLED";
    await run.save();
    return true;
  }

  async getRun(organizationId: string, userId: string, runId: string) {
    return AgentRunModel.findOne({ id: runId, organizationId, userId });
  }

  async resumeRun(runId: string): Promise<void> {
    const model = runModelById.get(runId);
    await this.executeRun(runId, model, true);
  }

  private async isCancelled(runId: string): Promise<boolean> {
    return activeRunAbort.get(runId)?.cancelled === true;
  }

  async executeRun(runId: string, model?: string, isResume = false): Promise<void> {
    const started = Date.now();
    const run = await AgentRunModel.findOne({ id: runId });
    if (!run) return;

    if (run.status === "WAITING" && !isResume) {
      return;
    }

    try {
      if (await this.isCancelled(runId)) return;

      if (!isResume) {
      const ctx = await repositoryContextManager.buildInitialContext({
        organizationId: run.organizationId,
        repositoryId: run.repositoryId,
        branch: run.branch,
        task: run.task,
      });

      run.discoveredFiles = ctx.discoveredFiles;
      run.relevantFiles = ctx.relevantFiles;
      await run.save();

      // ─── Planning ───────────────────────────────────────────────────────
      const planning = await modelRouter.generate({
        organizationId: run.organizationId,
        model,
        options: {
          systemInstruction: AGENT_SYSTEM_INSTRUCTION,
          messages: [
            {
              role: "user",
              content: buildPlanningPrompt({
                task: run.task,
                repositoryMetadata: ctx.metadataBlock,
                repositoryStructure: ctx.structureBlock,
                codeContext: ctx.codeContextBlock,
                enableEdits: run.enableEdits,
              }),
            },
          ],
          temperature: 0.2,
          maxTokens: AGENT_CONFIG.planningMaxOutputTokens,
          timeoutMs: AGENT_CONFIG.runTimeoutMs,
        },
      });

      run.tokenUsage = mergeTokenUsage(run.tokenUsage, planning.usage, { iterations: 1 });
      run.iterationCount += 1;

      const planResult = parseJsonFromModel<IPlanningResult>(planning.text);
      const steps: IPlanStep[] = (planResult.steps || []).map((s, idx) => ({
        id: `step-${idx + 1}`,
        description: s.description,
        status: "PENDING" as const,
        relevantFiles: s.relevantFiles || [],
        reason: s.reason,
      }));

      if (steps.length === 0) {
        throw new Error("Planning produced no steps.");
      }

      run.plan = steps;
      run.status = "ANALYZING";
      run.loopPhase = "SEARCH";
      run.currentStep = steps[0].id;
      await run.save();
      }

      const { githubRepositoryExplorerService } = await import(
        "../../githubRepositoryExplorerService"
      );
      const { initWorkspace, saveWorkspaceBaseline } = await import("./agentWorkspaceService");
      const { repository } = await githubRepositoryExplorerService.verifyAndGetRepository(
        run.organizationId,
        run.repositoryId
      );

      const branch = run.branch || repository.selectedBranch || repository.defaultBranch || "main";

      if (run.enableEdits && !run.workspaceInitialized) {
        await initWorkspace({
          runId: run.id,
          organizationId: run.organizationId,
          repositoryId: run.repositoryId,
          branch,
        });
        await saveWorkspaceBaseline(run.id);
        run.workspaceInitialized = true;
        await run.save();
      }

      const toolCtx = {
        organizationId: run.organizationId,
        userId: run.userId,
        repositoryId: run.repositoryId,
        branch,
        runId: run.id,
        enableEdits: run.enableEdits,
        autonomousMode: run.editMode === "autonomous",
      };

      let toolDigest = isResume ? "" : "";
      const seenToolKeys = new Set<string>();

      // ─── Analysis iterations ──────────────────────────────────────────────
      while (
        run.iterationCount < AGENT_CONFIG.maxIterations &&
        Date.now() - started < AGENT_CONFIG.runTimeoutMs
      ) {
        if (await this.isCancelled(runId)) {
          run.status = "CANCELLED";
          await run.save();
          return;
        }

        const pendingStep = run.plan.find((s) => s.status === "PENDING" || s.status === "IN_PROGRESS");
        if (!pendingStep) break;

        if (pendingStep.status === "PENDING") {
          pendingStep.status = "IN_PROGRESS";
          run.currentStep = pendingStep.id;
          await run.save();
        }

        const decisionResult = await modelRouter.generate({
          organizationId: run.organizationId,
          model,
          options: {
            systemInstruction: AGENT_SYSTEM_INSTRUCTION,
            messages: [
              {
                role: "user",
                content: buildAgentDecisionPrompt({
                  task: run.task,
                  planJson: JSON.stringify(run.plan),
                  compactState: compactStateForPrompt(run, toolDigest),
                  toolCatalog: formatToolCatalogForPrompt(),
                  pendingStep: `${pendingStep.id}: ${pendingStep.description}`,
                  loopPhase: run.loopPhase,
                }),
              },
            ],
            temperature: 0.2,
            maxTokens: AGENT_CONFIG.decisionMaxOutputTokens,
            timeoutMs: AGENT_CONFIG.runTimeoutMs,
          },
        });

        run.tokenUsage = mergeTokenUsage(run.tokenUsage, decisionResult.usage, { iterations: 1 });
        run.iterationCount += 1;

        const decision = parseJsonFromModel<IAgentDecision>(decisionResult.text);

        if (decision.action === "tool" && decision.toolName) {
          if (["search_code", "list_files"].includes(decision.toolName)) {
            run.loopPhase = "SEARCH";
          } else if (decision.toolName === "read_file") {
            run.loopPhase = "READ";
          } else if (
            ["apply_patch", "write_file", "delete_file", "rename_file"].includes(decision.toolName)
          ) {
            run.loopPhase = "EDIT";
          } else if (decision.toolName === "get_workspace_diff") {
            run.loopPhase = "DIFF";
          }

          const toolKey = `${decision.toolName}:${JSON.stringify(decision.toolInput || {})}`;
          if (seenToolKeys.has(toolKey)) {
            toolDigest += `\n[skipped duplicate tool ${decision.toolName}]`;
          } else {
            seenToolKeys.add(toolKey);
            const output = await executeAgentTool(
              toolCtx,
              decision.toolName,
              decision.toolInput || {}
            );
            run.tokenUsage = mergeTokenUsage(run.tokenUsage, undefined, { toolCalls: 1 });
            const outStr = JSON.stringify(output).slice(0, 1500);
            toolDigest = `${toolDigest}\n[${decision.toolName}] ${outStr}`.slice(-6000);

            // Track paths from tool results
            if (decision.toolName === "read_file" && decision.toolInput?.path) {
              const p = String(decision.toolInput.path);
              if (!run.relevantFiles.includes(p)) run.relevantFiles.push(p);
            }
            if (decision.toolName === "search_code" && output && typeof output === "object") {
              const items = (output as { items?: Array<{ path: string }> }).items || [];
              for (const item of items) {
                if (!run.discoveredFiles.includes(item.path)) run.discoveredFiles.push(item.path);
              }
            }
            if (
              output &&
              typeof output === "object" &&
              (output as { requiresApproval?: boolean }).requiresApproval
            ) {
              run.loopPhase = "REVIEW";
              await run.save();
              return;
            }
          }
          await run.save();
          const refreshed = await AgentRunModel.findOne({ id: runId });
          if (refreshed?.status === "WAITING") {
            return;
          }
          continue;
        }

        if (decision.action === "complete_step" && decision.stepId) {
          const step = run.plan.find((s) => s.id === decision.stepId);
          if (step) {
            step.status = "COMPLETED";
            step.result = decision.stepResult || decision.reason || "Step analyzed.";
            run.currentStep = step.id;
          }
          await run.save();
          continue;
        }

        if (decision.action === "finish") {
          if (pendingStep.status === "IN_PROGRESS") {
            pendingStep.status = "COMPLETED";
            pendingStep.result =
              decision.finalSummary?.slice(0, 500) || decision.reason || "Analysis complete.";
          }
          run.finalResult = decision.finalSummary || decision.reason;
          break;
        }

        // Fallback: mark step complete with model reason
        pendingStep.status = "COMPLETED";
        pendingStep.result = decision.reason || "Analyzed with available context.";
        await run.save();
      }

      const hasIncomplete = run.plan.some(
        (s) => s.status === "PENDING" || s.status === "IN_PROGRESS"
      );
      if (hasIncomplete) {
        for (const step of run.plan) {
          if (step.status === "PENDING" || step.status === "IN_PROGRESS") {
            step.status = "FAILED";
            step.result = "Not completed before iteration or time limit.";
          }
        }
      }

      if (!run.finalResult) {
        const finalGen = await modelRouter.generate({
          organizationId: run.organizationId,
          model,
          options: {
            systemInstruction: AGENT_SYSTEM_INSTRUCTION,
            messages: [
              {
                role: "user",
                content: buildFinalExplanationPrompt({
                  task: run.task,
                  planJson: JSON.stringify(run.plan),
                  findings: toolDigest,
                  diffSummary: JSON.stringify(run.diffSummary || {}),
                }),
              },
            ],
            temperature: 0.3,
            maxTokens: AGENT_CONFIG.finalMaxOutputTokens,
            timeoutMs: AGENT_CONFIG.runTimeoutMs,
          },
        });
        run.tokenUsage = mergeTokenUsage(run.tokenUsage, finalGen.usage, { iterations: 1 });
        run.finalResult = finalGen.text;
        run.iterationCount += 1;
      }

      if (await this.isCancelled(runId)) {
        run.status = "CANCELLED";
      } else {
        run.status = "COMPLETED";
        run.currentStep = undefined;
      }
      await run.save();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Agent run failed.";
      run.status = "FAILED";
      run.error = message;
      await run.save();
    } finally {
      if ((await AgentRunModel.findOne({ id: runId }))?.status !== "WAITING") {
        activeRunAbort.delete(runId);
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
