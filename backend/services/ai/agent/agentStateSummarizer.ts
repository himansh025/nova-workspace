import type { IAgentRunDocument } from "../../../models/AgentRun";

export function buildAgentStateSummary(run: IAgentRunDocument): string {
  const completed = run.plan
    .filter((s) => s.status === "COMPLETED")
    .map((s) => `${s.id}: ${s.description}`)
    .slice(-6);
  const pending = run.plan
    .filter((s) => s.status === "PENDING" || s.status === "IN_PROGRESS")
    .map((s) => `${s.id}: ${s.description}`)
    .slice(0, 4);

  return [
    `phase=${run.loopPhase || "?"}`,
    `step=${run.currentStep || "-"}`,
    `verification=${run.verificationStatus}`,
    `git=${run.gitWorkflowStatus}`,
    `publish=${run.publishStatus}`,
    `modified=${run.modifiedFiles.slice(0, 8).join(",")}`,
    `pending=${pending.join("; ") || "none"}`,
    `done=${completed.join("; ") || "none"}`,
  ].join("\n");
}

export function compactCompletedPlanSteps(run: IAgentRunDocument): Array<{
  id: string;
  description: string;
}> {
  return run.plan
    .filter((s) => s.status === "COMPLETED")
    .map((s) => ({
      id: s.id,
      description: s.description,
      result: s.result ? s.result.slice(0, 120) : undefined,
    }))
    .slice(-8) as any;
}

export function compactToolDigest(entries: string[], maxChars: number): string {
  const joined = entries.join("\n");
  if (joined.length <= maxChars) return joined;
  return joined.slice(-maxChars);
}
