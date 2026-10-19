import { AGENT_CONFIG } from "./agentConfig";
import type { IAgentToolContext, IAgentToolDefinition } from "./agentTypes";
import { sandboxExecutorService } from "./sandboxExecutorService";

function requireRun(ctx: IAgentToolContext): void {
  if (!ctx.runId) throw new Error("Agent run context is required for execution tools.");
  if (!ctx.enableVerification) {
    throw new Error("Verification is disabled for this agent run.");
  }
}

async function runKind(ctx: IAgentToolContext, kind: "test" | "build" | "lint", tool: string) {
  return sandboxExecutorService.runAllowlisted(ctx.runId!, kind, tool);
}

export const executionTools: IAgentToolDefinition[] = [
  {
    name: "run_tests",
    description: "Run allowlisted package tests in an isolated sandbox (never on the host shell).",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx) {
      return runKind(ctx, "test", "run_tests");
    },
  },
  {
    name: "run_build",
    description: "Run allowlisted package build script in the sandbox.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx) {
      return runKind(ctx, "build", "run_build");
    },
  },
  {
    name: "run_linter",
    description: "Run allowlisted package lint script in the sandbox.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireRun,
    async execute(ctx) {
      return runKind(ctx, "lint", "run_linter");
    },
  },
];

export const EXECUTION_TOOL_NAMES = new Set(executionTools.map((t) => t.name));
