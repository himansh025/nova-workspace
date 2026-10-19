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
import { EXECUTION_TOOL_NAMES } from "./executionToolRegistry";
import { GIT_TOOL_NAMES } from "./gitToolRegistry";
import { GITHUB_PUBLISH_TOOL_NAMES } from "./githubPublishToolRegistry";
import { agentSelfFixService } from "./agentSelfFixService";
import type { ISandboxRunResult } from "./sandboxExecutorService";
import {
  clearRunDedupState,
  getRunDedupState,
  hydrateDedupState,
  serializeDedupState,
  shouldSkipToolResult,
} from "./agentContextDeduplication";
import { compressToolResult } from "./agentToolResultCompressor";
import { emptyLedger, recordTokenUsage, type ITokenBudgetLedger } from "./agentTokenBudget";
import { compactToolDigest } from "./agentStateSummarizer";
import { rankRelevantFiles } from "./agentRelevanceService";
import {
  buildCompactAgentContext,
  serializeCompactAgentContext,
} from "./agentContextCompaction";
import { classifyTaskComplexity, type TaskComplexity } from "./agentModelRouting";
import {
  checkRunLimits,
  resolveRunLimits,
  type IRunLimitCheck,
  type IAgentRunLimits,
} from "./agentRunLimits";

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

function ensureRunLimits(run: IAgentRunDocument): IAgentRunLimits {
  if (run.limits?.maxIterations) return run.limits;
  const resolved = resolveRunLimits();
  run.limits = resolved;
  return resolved;
}

function getRunLimitViolation(
  run: IAgentRunDocument,
  startedAtMs: number
): IRunLimitCheck | null {
  const check = checkRunLimits({
    limits: ensureRunLimits(run),
    tokenUsage: run.tokenUsage,
    iterationCount: run.iterationCount,
    startedAtMs,
  });
  return check.exceeded ? check : null;
}

function remainingOutputTokenBudget(run: IAgentRunDocument, cap: number): number {
  const limits = ensureRunLimits(run);
  const remaining = limits.maxOutputTokens - run.tokenUsage.outputTokens;
  return Math.max(256, Math.min(cap, remaining));
}

function complexityForRun(run: IAgentRunDocument): TaskComplexity {
  return (
    run.taskComplexity ||
    classifyTaskComplexity(run.task, {
      planStepCount: run.plan.length,
      modifiedFileCount: run.modifiedFiles.length,
    })
  );
}

function persistOptimizationState(run: IAgentRunDocument, runId: string): void {
  const dedup = serializeDedupState(getRunDedupState(runId));
  run.contextOptimization = {
    ...run.contextOptimization,
    sentFilePaths: dedup.sentFilePaths,
    toolResultHashes: dedup.toolResultHashes,
    contentKeys: dedup.contentKeys,
    stateSummary: run.contextOptimization?.stateSummary,
  };
}

function trackModelUsage(
  ledger: ITokenBudgetLedger,
  phase: "planning" | "decision" | "final",
  usage?: { totalTokens?: number }
): ITokenBudgetLedger {
  const tokens = usage?.totalTokens || 0;
  return recordTokenUsage(ledger, phase, tokens);
}

async function stopRunGracefully(
  run: IAgentRunDocument,
  runId: string,
  reason: string,
  toolDigest: string
): Promise<void> {
  run.stopReason = reason;
  if (!run.finalResult) {
    run.finalResult = `Run stopped within configured limits: ${reason}`;
    if (toolDigest.trim()) {
      run.finalResult += `\n\nRecent activity:\n${toolDigest.slice(-2000)}`;
    }
  }
  for (const step of run.plan) {
    if (step.status === "PENDING" || step.status === "IN_PROGRESS") {
      step.status = "FAILED";
      step.result = step.result || "Not completed (run limit reached).";
    }
  }
  run.status = "COMPLETED";
  run.currentStep = undefined;
  persistOptimizationState(run, runId);
  await run.save();
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
    enableVerification?: boolean;
    enableGitWorkflow?: boolean;
    enableGithubPublish?: boolean;
    publishMode?: "pr" | "push_only";
    limits?: Partial<IAgentRunLimits>;
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
      enableVerification: params.enableVerification !== false,
      verificationStatus: "not_run",
      selfFixIterationCount: 0,
      enableGitWorkflow:
        params.enableGitWorkflow !== false && AGENT_CONFIG.defaultEnableGitWorkflow,
      gitWorkflowStatus: "idle",
      enableGithubPublish:
        params.enableGithubPublish !== false && AGENT_CONFIG.defaultEnableGithubPublish,
      publishMode: params.publishMode || AGENT_CONFIG.defaultPublishMode,
      publishStatus: "idle",
      limits: resolveRunLimits(params.limits),
      taskComplexity: classifyTaskComplexity(params.task.trim()),
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

    let tokenLedger = emptyLedger();
    if (run.tokenBudget) {
      tokenLedger = { ...run.tokenBudget };
    }
    hydrateDedupState(runId, run.contextOptimization);
    const toolDigestParts: string[] = isResume ? [] : [];
    const runLimits = ensureRunLimits(run);
    let toolDigest = "";

    try {
      if (await this.isCancelled(runId)) return;

      const limitBefore = getRunLimitViolation(run, started);
      if (limitBefore?.message) {
        await stopRunGracefully(run, runId, limitBefore.message, toolDigest);
        return;
      }

      if (!isResume) {
      const ctx = await repositoryContextManager.buildInitialContext({
        organizationId: run.organizationId,
        repositoryId: run.repositoryId,
        branch: run.branch,
        task: run.task,
        runId: run.id,
      });

      run.discoveredFiles = ctx.discoveredFiles;
      run.relevantFiles = rankRelevantFiles({
        task: run.task,
        discovered: ctx.discoveredFiles,
        planFiles: [],
        modified: run.modifiedFiles,
        limit: AGENT_CONFIG.maxFilesInContext,
      });
      await run.save();

      // ─── Planning ───────────────────────────────────────────────────────
      const planning = await modelRouter.generate({
        organizationId: run.organizationId,
        model,
        task: "planning",
        complexity: complexityForRun(run),
        taskText: run.task,
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
                symbolIndex: ctx.symbolIndexBlock,
                enableEdits: run.enableEdits,
              }),
            },
          ],
          temperature: 0.2,
          maxTokens: remainingOutputTokenBudget(run, AGENT_CONFIG.planningMaxOutputTokens),
          timeoutMs: ensureRunLimits(run).maxExecutionTimeMs,
        },
      });

      tokenLedger = trackModelUsage(tokenLedger, "planning", planning.usage);
      run.tokenBudget = tokenLedger;
      run.tokenUsage = mergeTokenUsage(run.tokenUsage, planning.usage, { iterations: 1 });
      run.iterationCount += 1;
      run.taskComplexity = classifyTaskComplexity(run.task, { planStepCount: 0 });

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
      run.taskComplexity = classifyTaskComplexity(run.task, { planStepCount: steps.length });
      run.status = "ANALYZING";
      run.loopPhase = "SEARCH";
      run.currentStep = steps[0].id;
      await run.save();

      const afterPlanLimit = getRunLimitViolation(run, started);
      if (afterPlanLimit?.message) {
        toolDigest = compactToolDigest(toolDigestParts, AGENT_CONFIG.compressedToolMaxChars);
        await stopRunGracefully(run, runId, afterPlanLimit.message, toolDigest);
        return;
      }
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
        enableVerification: run.enableVerification,
        enableGitWorkflow: run.enableGitWorkflow,
        enableGithubPublish: run.enableGithubPublish,
        publishMode: run.publishMode,
      };

      toolDigest = compactToolDigest(toolDigestParts, AGENT_CONFIG.compressedToolMaxChars);
      const seenToolKeys = new Set<string>();

      // ─── Analysis iterations ──────────────────────────────────────────────
      while (
        run.iterationCount < runLimits.maxIterations &&
        Date.now() - started < runLimits.maxExecutionTimeMs
      ) {
        const loopLimit = getRunLimitViolation(run, started);
        if (loopLimit?.message) {
          await stopRunGracefully(run, runId, loopLimit.message, toolDigest);
          return;
        }

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

        const decisionTask =
          run.verificationStatus === "failed" || run.loopPhase === "EDIT" ? "repair" : "decision";

        const compactCtx = serializeCompactAgentContext(
          buildCompactAgentContext(run, toolDigest)
        );

        const decisionResult = await modelRouter.generate({
          organizationId: run.organizationId,
          model,
          task: decisionTask,
          complexity: complexityForRun(run),
          taskText: run.task,
          complexityHints: {
            planStepCount: run.plan.length,
            modifiedFileCount: run.modifiedFiles.length,
          },
          options: {
            systemInstruction: AGENT_SYSTEM_INSTRUCTION,
            messages: [
              {
                role: "user",
                content: buildAgentDecisionPrompt({
                  compactContextJson: compactCtx,
                  toolCatalog: formatToolCatalogForPrompt(),
                  loopPhase: run.loopPhase,
                }),
              },
            ],
            temperature: 0.2,
            maxTokens: remainingOutputTokenBudget(run, AGENT_CONFIG.decisionMaxOutputTokens),
            timeoutMs: runLimits.maxExecutionTimeMs,
          },
        });

        tokenLedger = trackModelUsage(tokenLedger, "decision", decisionResult.usage);
        run.tokenBudget = tokenLedger;
        run.tokenUsage = mergeTokenUsage(run.tokenUsage, decisionResult.usage, { iterations: 1 });
        run.iterationCount += 1;

        const afterDecisionLimit = getRunLimitViolation(run, started);
        if (afterDecisionLimit?.message) {
          await stopRunGracefully(run, runId, afterDecisionLimit.message, toolDigest);
          return;
        }

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
          } else if (EXECUTION_TOOL_NAMES.has(decision.toolName)) {
            run.loopPhase = "TEST";
          } else if (GIT_TOOL_NAMES.has(decision.toolName)) {
            run.loopPhase = "GIT";
          } else if (GITHUB_PUBLISH_TOOL_NAMES.has(decision.toolName)) {
            run.loopPhase = "PUBLISH";
          }

          const toolKey = `${decision.toolName}:${JSON.stringify(decision.toolInput || {})}`;
          if (seenToolKeys.has(toolKey)) {
            toolDigest += `\n[skipped duplicate tool ${decision.toolName}]`;
          } else {
            seenToolKeys.add(toolKey);
            const toolInput = decision.toolInput || {};
            let output: unknown;
            if (shouldSkipToolResult(runId, decision.toolName, toolInput)) {
              toolDigestParts.push(`[skipped duplicate tool result ${decision.toolName}]`);
            } else {
              output = await executeAgentTool(toolCtx, decision.toolName, toolInput);
              run.tokenUsage = mergeTokenUsage(run.tokenUsage, undefined, { toolCalls: 1 });
              tokenLedger = recordTokenUsage(
                tokenLedger,
                "tools",
                AGENT_CONFIG.toolResultTokenEstimate
              );
              run.tokenBudget = tokenLedger;
              const compressed = compressToolResult(decision.toolName, output);
              toolDigestParts.push(`[${decision.toolName}] ${JSON.stringify(compressed)}`);
            }
            toolDigest = compactToolDigest(toolDigestParts, AGENT_CONFIG.compressedToolMaxChars);

            const afterToolLimit = getRunLimitViolation(run, started);
            if (afterToolLimit?.message) {
              await stopRunGracefully(run, runId, afterToolLimit.message, toolDigest);
              return;
            }

            // Track paths from tool results
            if (decision.toolName === "read_file" && toolInput?.path) {
              const p = String(toolInput.path);
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

            if (EXECUTION_TOOL_NAMES.has(decision.toolName) && output && typeof output === "object") {
              const exec = output as ISandboxRunResult;
              run.lastExecution = {
                tool: exec.tool,
                command: exec.command,
                exitCode: exec.exitCode,
                success: exec.success,
                durationMs: exec.durationMs,
                errorSummary: exec.errorSummary,
                sandbox: exec.sandbox,
              };
              run.verificationStatus = exec.success ? "passed" : "failed";
              run.loopPhase = exec.success ? "VERIFY" : "EDIT";

              if (agentSelfFixService.shouldAttemptSelfFix(run, exec)) {
                agentSelfFixService.recordSelfFixAttempt(run);
                toolDigestParts.push(
                  `[SELF_FIX_CONTEXT] ${agentSelfFixService.buildFailureDigest(run, exec)}`
                );
                toolDigest = compactToolDigest(toolDigestParts, AGENT_CONFIG.compressedToolMaxChars);
              }
            }
          }
          persistOptimizationState(run, runId);
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

      if (!run.finalResult && !run.stopReason) {
        const testsVerified = run.verificationStatus === "passed" && run.lastExecution?.success;
        const finalLimit = getRunLimitViolation(run, started);
        if (finalLimit?.message) {
          await stopRunGracefully(run, runId, finalLimit.message, toolDigest);
          return;
        }
        const finalGen = await modelRouter.generate({
          organizationId: run.organizationId,
          model,
          task: "final",
          complexity: complexityForRun(run),
          taskText: run.task,
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
                  verificationStatus: run.verificationStatus,
                  testsVerified,
                  lastExecution: run.lastExecution,
                }),
              },
            ],
            temperature: 0.3,
            maxTokens: remainingOutputTokenBudget(run, AGENT_CONFIG.finalMaxOutputTokens),
            timeoutMs: runLimits.maxExecutionTimeMs,
          },
        });
        tokenLedger = trackModelUsage(tokenLedger, "final", finalGen.usage);
        run.tokenBudget = tokenLedger;
        run.tokenUsage = mergeTokenUsage(run.tokenUsage, finalGen.usage, { iterations: 1 });
        let finalText = finalGen.text;
        if (/tests?\s+passed/i.test(finalText) && !testsVerified) {
          finalText = `${finalText}\n\n(Note: sandbox tests did not pass — do not treat this run as verified.)`;
        }
        run.finalResult = finalText;
        run.iterationCount += 1;
      }

      if (await this.isCancelled(runId)) {
        run.status = "CANCELLED";
      } else {
        run.status = "COMPLETED";
        run.currentStep = undefined;
      }
      persistOptimizationState(run, runId);
      run.tokenBudget = tokenLedger;
      await run.save();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Agent run failed.";
      run.status = "FAILED";
      run.error = message;
      await run.save();
    } finally {
      const finalStatus = (await AgentRunModel.findOne({ id: runId }))?.status;
      if (finalStatus !== "WAITING") {
        activeRunAbort.delete(runId);
        clearRunDedupState(runId);
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
