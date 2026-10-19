import type { IAgentTokenUsage } from "./agentTypes";
import { AGENT_CONFIG } from "./agentConfig";

export interface IAgentRunLimits {
  maxInputTokens: number;
  maxOutputTokens: number;
  maxIterations: number;
  maxToolCalls: number;
  maxExecutionTimeMs: number;
}

export type RunLimitKind =
  | "maxInputTokens"
  | "maxOutputTokens"
  | "maxIterations"
  | "maxToolCalls"
  | "maxExecutionTime";

export interface IRunLimitCheck {
  exceeded: boolean;
  kind?: RunLimitKind;
  message?: string;
}

export function resolveRunLimits(partial?: Partial<IAgentRunLimits>): IAgentRunLimits {
  return {
    maxInputTokens: partial?.maxInputTokens ?? AGENT_CONFIG.defaultMaxInputTokens,
    maxOutputTokens: partial?.maxOutputTokens ?? AGENT_CONFIG.defaultMaxOutputTokens,
    maxIterations: partial?.maxIterations ?? AGENT_CONFIG.maxIterations,
    maxToolCalls: partial?.maxToolCalls ?? AGENT_CONFIG.defaultMaxToolCalls,
    maxExecutionTimeMs: partial?.maxExecutionTimeMs ?? AGENT_CONFIG.runTimeoutMs,
  };
}

export function checkRunLimits(params: {
  limits: IAgentRunLimits;
  tokenUsage: IAgentTokenUsage;
  iterationCount: number;
  startedAtMs: number;
}): IRunLimitCheck {
  const { limits, tokenUsage, iterationCount, startedAtMs } = params;

  if (iterationCount >= limits.maxIterations) {
    return {
      exceeded: true,
      kind: "maxIterations",
      message: `Iteration limit reached (${limits.maxIterations}).`,
    };
  }
  if (tokenUsage.toolCalls >= limits.maxToolCalls) {
    return {
      exceeded: true,
      kind: "maxToolCalls",
      message: `Tool call limit reached (${limits.maxToolCalls}).`,
    };
  }
  if (Date.now() - startedAtMs >= limits.maxExecutionTimeMs) {
    return {
      exceeded: true,
      kind: "maxExecutionTime",
      message: `Execution time limit reached (${limits.maxExecutionTimeMs}ms).`,
    };
  }
  if (tokenUsage.inputTokens >= limits.maxInputTokens) {
    return {
      exceeded: true,
      kind: "maxInputTokens",
      message: `Input token limit reached (${limits.maxInputTokens}).`,
    };
  }
  if (tokenUsage.outputTokens >= limits.maxOutputTokens) {
    return {
      exceeded: true,
      kind: "maxOutputTokens",
      message: `Output token limit reached (${limits.maxOutputTokens}).`,
    };
  }
  return { exceeded: false };
}
