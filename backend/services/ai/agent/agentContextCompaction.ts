import type { IAgentRunDocument } from "../../../models/AgentRun";

export interface ICompactAgentContext {
  task: string;
  plan: Array<{
    id: string;
    description: string;
    status: string;
    resultPreview?: string;
  }>;
  currentStep: { id: string; description: string } | null;
  relevantFiles: string[];
  changes: {
    modifiedFiles: string[];
    diffSummary?: unknown;
  };
  testResult: {
    verificationStatus: string;
    success?: boolean;
    exitCode?: number;
    tool?: string;
    errorSummary?: string;
  } | null;
  currentError: string | null;
  loopPhase?: string;
  recentToolResults: string;
}

function compactPlan(run: IAgentRunDocument): ICompactAgentContext["plan"] {
  return run.plan.map((s) => ({
    id: s.id,
    description: s.description,
    status: s.status,
    resultPreview: s.result ? s.result.slice(0, 160) : undefined,
  }));
}

/**
 * Structured agent state for decision prompts — not full conversation history.
 */
export function buildCompactAgentContext(
  run: IAgentRunDocument,
  recentToolResults: string
): ICompactAgentContext {
  const current = run.plan.find((s) => s.id === run.currentStep);
  const pending = run.plan.find((s) => s.status === "PENDING" || s.status === "IN_PROGRESS");
  const step = current || pending;

  const currentError =
    run.error ||
    run.publishError ||
    run.gitError ||
    (run.verificationStatus === "failed" ? run.lastExecution?.errorSummary : undefined) ||
    null;

  return {
    task: run.task,
    plan: compactPlan(run),
    currentStep: step ? { id: step.id, description: step.description } : null,
    relevantFiles: run.relevantFiles.slice(0, 16),
    changes: {
      modifiedFiles: run.modifiedFiles.slice(0, 16),
      diffSummary: run.diffSummary,
    },
    testResult: run.lastExecution
      ? {
          verificationStatus: run.verificationStatus,
          success: run.lastExecution.success,
          exitCode: run.lastExecution.exitCode,
          tool: run.lastExecution.tool,
          errorSummary: run.lastExecution.errorSummary?.slice(0, 500),
        }
      : run.verificationStatus !== "not_run"
        ? { verificationStatus: run.verificationStatus }
        : null,
    currentError: currentError ? String(currentError).slice(0, 800) : null,
    loopPhase: run.loopPhase,
    recentToolResults,
  };
}

export function serializeCompactAgentContext(ctx: ICompactAgentContext): string {
  return JSON.stringify(ctx, null, 0);
}
