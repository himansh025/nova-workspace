import { AGENT_CONFIG } from "./agentConfig";
import type { IAgentToolContext, IAgentToolDefinition } from "./agentTypes";
import { gitWorkflowService } from "./gitWorkflowService";

function requireGit(ctx: IAgentToolContext): void {
  if (!ctx.runId) throw new Error("Agent run context is required.");
  if (!ctx.enableGitWorkflow) {
    throw new Error("Git workflow is disabled for this run.");
  }
}

export const gitTools: IAgentToolDefinition[] = [
  {
    name: "create_branch",
    description:
      "Create agent branch nova/agent/<run>-<slug> in the workspace repo after verification passes. Never uses main/master.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireGit,
    async execute(ctx) {
      return gitWorkflowService.createBranch(ctx.runId!, ctx.organizationId, ctx.userId);
    },
  },
  {
    name: "git_status",
    description: "Show git status in the workspace repository (bounded).",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireGit,
    async execute(ctx) {
      return gitWorkflowService.gitStatus(ctx.runId!, ctx.organizationId, ctx.userId);
    },
  },
  {
    name: "git_diff",
    description: "Show workspace and git diffs for agent changes (bounded).",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireGit,
    async execute(ctx) {
      return gitWorkflowService.gitDiff(ctx.runId!, ctx.organizationId, ctx.userId);
    },
  },
  {
    name: "create_commit",
    description:
      "Stage only agent-modified files, validate no secrets, and create a local commit (no push).",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requireGit,
    async execute(ctx) {
      return gitWorkflowService.createCommit(ctx.runId!, ctx.organizationId, ctx.userId);
    },
  },
];

export const GIT_TOOL_NAMES = new Set(gitTools.map((t) => t.name));
