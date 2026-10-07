import { AGENT_CONFIG } from "./agentConfig";

export type TokenBudgetPhase = "planning" | "decision" | "tools" | "final";

export interface ITokenBudgetLedger {
  planning: number;
  decision: number;
  tools: number;
  final: number;
  total: number;
}

export function emptyLedger(): ITokenBudgetLedger {
  return { planning: 0, decision: 0, tools: 0, final: 0, total: 0 };
}

export function recordTokenUsage(
  ledger: ITokenBudgetLedger,
  phase: TokenBudgetPhase,
  tokens: number
): ITokenBudgetLedger {
  const next = { ...ledger };
  next[phase] += tokens;
  next.total += tokens;
  return next;
}

export function assertWithinBudget(ledger: ITokenBudgetLedger, phase: TokenBudgetPhase): void {
  const limits: Record<TokenBudgetPhase, number> = {
    planning: AGENT_CONFIG.tokenBudgetPlanning,
    decision: AGENT_CONFIG.tokenBudgetDecision,
    tools: AGENT_CONFIG.tokenBudgetTools,
    final: AGENT_CONFIG.tokenBudgetFinal,
  };
  if (ledger[phase] > limits[phase]) {
    throw new Error(
      `Agent token budget exceeded for ${phase} (${ledger[phase]} > ${limits[phase]}).`
    );
  }
  if (ledger.total > AGENT_CONFIG.tokenBudgetTotal) {
    throw new Error(
      `Agent total token budget exceeded (${ledger.total} > ${AGENT_CONFIG.tokenBudgetTotal}).`
    );
  }
}

export function estimateCharsToTokens(chars: number): number {
  return Math.ceil(chars / 4);
}
