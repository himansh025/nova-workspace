import { AGENT_CONFIG } from "./agentConfig";
import type { IAgentToolContext, IAgentToolDefinition } from "./agentTypes";
import { agentGithubPublishService } from "./agentGithubPublishService";

function requirePublish(ctx: IAgentToolContext): void {
  if (!ctx.runId) throw new Error("Agent run context is required.");
  if (!ctx.enableGithubPublish) {
    throw new Error("GitHub publish is disabled for this run.");
  }
}

export const githubPublishTools: IAgentToolDefinition[] = [
  {
    name: "push_branch",
    description:
      "Push the agent branch to GitHub (never main/master). Requires local commit. Idempotent per commit SHA.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requirePublish,
    async execute(ctx) {
      return agentGithubPublishService.pushBranch(ctx.runId!, ctx.organizationId, ctx.userId);
    },
  },
  {
    name: "create_pull_request",
    description:
      "Push if needed and open a GitHub PR with agent summary, files, and test results. Default publish path.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: requirePublish,
    async execute(ctx) {
      if (ctx.publishMode === "push_only") {
        return agentGithubPublishService.pushBranch(ctx.runId!, ctx.organizationId, ctx.userId);
      }
      return agentGithubPublishService.createPullRequest(
        ctx.runId!,
        ctx.organizationId,
        ctx.userId
      );
    },
  },
];

export const GITHUB_PUBLISH_TOOL_NAMES = new Set(githubPublishTools.map((t) => t.name));
