import type { IAgentRunDocument } from "../../../models/AgentRun";
import type { ISandboxRunResult } from "./sandboxExecutorService";
import { buildCompactFailureContext } from "./executionOutputService";
import { AGENT_CONFIG } from "./agentConfig";

export const agentSelfFixService = {
  shouldAttemptSelfFix(run: IAgentRunDocument, execution: ISandboxRunResult): boolean {
    if (execution.success) return false;
    if (!run.enableEdits) return false;
    return (run.selfFixIterationCount || 0) < AGENT_CONFIG.maxSelfFixIterations;
  },

  recordSelfFixAttempt(run: IAgentRunDocument): void {
    run.selfFixIterationCount = (run.selfFixIterationCount || 0) + 1;
  },

  buildFailureDigest(run: IAgentRunDocument, execution: ISandboxRunResult): string {
    const step = run.plan.find((s) => s.id === run.currentStep);
    return buildCompactFailureContext({
      planStep: step ? `${step.id}: ${step.description}` : undefined,
      modifiedFiles: run.modifiedFiles,
      diffSummary: JSON.stringify(run.diffSummary || {}),
      execution: execution,
    });
  },
};
