import { AGENT_CONFIG } from "./agentConfig";

export type AgentModelTask = "planning" | "decision" | "repair" | "final";
export type TaskComplexity = "simple" | "complex";

const COMPLEX_SIGNALS = [
  "refactor",
  "migrate",
  "migration",
  "architecture",
  "security audit",
  "performance",
  "entire codebase",
  "across services",
  "multiple modules",
  "end-to-end",
  "integration test",
];

const SIMPLE_SIGNALS = ["typo", "rename ", "update label", "fix lint", "bump version", "single file"];

/**
 * Heuristic complexity for model routing (fast vs strong).
 */
export function classifyTaskComplexity(
  task: string,
  hints?: { planStepCount?: number; modifiedFileCount?: number }
): TaskComplexity {
  const t = task.toLowerCase().trim();
  if (COMPLEX_SIGNALS.some((s) => t.includes(s))) return "complex";
  if (t.length > 280) return "complex";
  if ((hints?.planStepCount || 0) > 6) return "complex";
  if ((hints?.modifiedFileCount || 0) > 5) return "complex";
  if (SIMPLE_SIGNALS.some((s) => t.includes(s)) && t.length < 140) return "simple";
  if (t.length < 120 && !/\b(and|across|multiple)\b/.test(t)) return "simple";
  return "complex";
}

export interface ModelRouteParams {
  task: AgentModelTask;
  complexity: TaskComplexity;
  userModel?: string;
  orgDefault?: string;
}

/**
 * Simple tasks → fast/cheap model; complex tasks → strong model (with per-task overrides).
 */
export function resolveModelForTask(params: ModelRouteParams): string {
  const base =
    params.userModel || params.orgDefault || AGENT_CONFIG.modelFast || "gemini-2.5-flash";
  if (!AGENT_CONFIG.enableTaskModelRouting) return base;

  const taskOverride: Record<AgentModelTask, string> = {
    planning: AGENT_CONFIG.modelPlanning,
    decision: AGENT_CONFIG.modelDecision,
    repair: AGENT_CONFIG.modelRepair,
    final: AGENT_CONFIG.modelFinal,
  };
  const override = taskOverride[params.task];
  if (override) return override;

  if (params.task === "repair") {
    return AGENT_CONFIG.modelStrong || base;
  }

  if (params.complexity === "simple") {
    return AGENT_CONFIG.modelFast || base;
  }
  return AGENT_CONFIG.modelStrong || base;
}

/** @deprecated Use resolveModelForTask with complexity */
export function resolveModelForTaskLegacy(
  task: AgentModelTask,
  userModel?: string,
  orgDefault?: string
): string {
  return resolveModelForTask({
    task,
    complexity: "complex",
    userModel,
    orgDefault,
  });
}
