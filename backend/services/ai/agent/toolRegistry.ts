import {
  githubRepositoryExplorerService,
  GitHubExplorerError,
} from "../../githubRepositoryExplorerService";
import { AGENT_CONFIG } from "./agentConfig";
import { validateAgentFilePath, sliceFileContent } from "./agentPathUtils";
import type { IAgentToolContext, IAgentToolDefinition } from "./agentTypes";
import { writeTools } from "./writeToolRegistry";
import { executionTools, EXECUTION_TOOL_NAMES } from "./executionToolRegistry";
import { gitTools, GIT_TOOL_NAMES } from "./gitToolRegistry";
import { readWorkspaceFile } from "./agentWorkspaceService";
import { agentAuditService } from "./agentAuditService";

const WRITE_TOOL_NAMES = new Set(writeTools.map((t) => t.name));

function boundOutput(data: unknown, maxChars: number): unknown {
  const json = JSON.stringify(data);
  if (json.length <= maxChars) {
    return data;
  }
  return {
    truncated: true,
    preview: json.slice(0, maxChars),
    originalLength: json.length,
  };
}

function assertRepoAccess(ctx: IAgentToolContext): void {
  if (!ctx.organizationId || !ctx.repositoryId) {
    throw new Error("Repository context is required.");
  }
}

const tools: IAgentToolDefinition[] = [
  {
    name: "list_files",
    description: "List files and directories at a path in the repository (paginated).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path, empty for root" },
        page: { type: "number" },
        perPage: { type: "number" },
      },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: assertRepoAccess,
    async execute(ctx, input) {
      const path =
        input.path === undefined || input.path === ""
          ? ""
          : validateAgentFilePath(String(input.path));
      const page = Number(input.page) || 1;
      const perPage = Math.min(Number(input.perPage) || 50, 100);
      const tree = await githubRepositoryExplorerService.getTree(
        ctx.organizationId,
        ctx.repositoryId,
        ctx.branch,
        path || undefined,
        page,
        perPage
      );
      return boundOutput(tree, AGENT_CONFIG.maxToolOutputChars);
    },
  },
  {
    name: "search_code",
    description: "Search code within the repository using GitHub code search.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        page: { type: "number" },
        perPage: { type: "number" },
      },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: assertRepoAccess,
    async execute(ctx, input) {
      const query = String(input.query || "").trim();
      if (!query) throw new Error("search_code requires a query.");
      const page = Number(input.page) || 1;
      const perPage = Math.min(Number(input.perPage) || 20, 30);
      const result = await githubRepositoryExplorerService.searchCode(
        ctx.organizationId,
        ctx.repositoryId,
        query,
        ctx.branch,
        page,
        perPage
      );
      return boundOutput(result, AGENT_CONFIG.maxToolOutputChars);
    },
  },
  {
    name: "read_file",
    description: "Read a text file with optional line range (bounded).",
    inputSchema: {
      type: "object",
      required: ["path"],
      properties: {
        path: { type: "string" },
        startLine: { type: "number" },
        endLine: { type: "number" },
      },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: assertRepoAccess,
    async execute(ctx, input) {
      const path = validateAgentFilePath(input.path);

      if (ctx.runId) {
        const local = await readWorkspaceFile(ctx.runId, path);
        if (local.exists && local.content !== undefined) {
          const sliced = sliceFileContent(
            local.content,
            input.startLine as number | undefined,
            input.endLine as number | undefined,
            AGENT_CONFIG.maxReadFileLines
          );
          return boundOutput(
            {
              path,
              source: "workspace",
              startLine: sliced.startLine,
              endLine: sliced.endLine,
              truncated: sliced.truncated,
              content: sliced.content,
            },
            AGENT_CONFIG.maxToolOutputChars
          );
        }
      }

      const file = await githubRepositoryExplorerService.getFile(
        ctx.organizationId,
        ctx.repositoryId,
        ctx.branch,
        path
      );

      if (file.type === "binary" || file.type === "file_too_large") {
        return {
          path,
          type: file.type,
          size: file.size,
          message: "File cannot be read as text for agent context.",
        };
      }

      const raw = file.content || "";
      const sliced = sliceFileContent(
        raw,
        input.startLine as number | undefined,
        input.endLine as number | undefined,
        AGENT_CONFIG.maxReadFileLines
      );

      return boundOutput(
        {
          path: file.path,
          language: file.language,
          size: file.size,
          startLine: sliced.startLine,
          endLine: sliced.endLine,
          truncated: sliced.truncated,
          content: sliced.content,
        },
        AGENT_CONFIG.maxToolOutputChars
      );
    },
  },
  {
    name: "get_repository_info",
    description: "Get repository metadata and overview for the connected repo.",
    inputSchema: { type: "object", properties: {} },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: assertRepoAccess,
    async execute(ctx) {
      const meta = await githubRepositoryExplorerService.getRepositoryMetadata(
        ctx.organizationId,
        ctx.repositoryId
      );
      return boundOutput(meta, AGENT_CONFIG.maxToolOutputChars);
    },
  },
  {
    name: "get_git_diff",
    description: "Get a bounded summary of changes for a commit SHA.",
    inputSchema: {
      type: "object",
      required: ["sha"],
      properties: { sha: { type: "string" } },
    },
    maxOutputChars: AGENT_CONFIG.maxToolOutputChars,
    authorize: assertRepoAccess,
    async execute(ctx, input) {
      const sha = String(input.sha || "").trim();
      const commit = await githubRepositoryExplorerService.getCommit(
        ctx.organizationId,
        ctx.repositoryId,
        sha
      );
      const bounded = {
        sha: commit.sha,
        message: commit.message.slice(0, 500),
        stats: commit.stats,
        files: commit.files.slice(0, 25).map((f) => ({
          filename: f.filename,
          status: f.status,
          additions: f.additions,
          deletions: f.deletions,
          patchSummary: f.patchSummary,
        })),
        fileCount: commit.files.length,
      };
      return boundOutput(bounded, AGENT_CONFIG.maxToolOutputChars);
    },
  },
  ...writeTools,
  ...executionTools,
  ...gitTools,
];

const toolMap = new Map(tools.map((t) => [t.name, t]));

export function listAgentTools(): Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}

export function getAgentTool(name: string): IAgentToolDefinition | undefined {
  return toolMap.get(name);
}

export async function executeAgentTool(
  ctx: IAgentToolContext,
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  const tool = getAgentTool(toolName);
  if (!tool) {
    throw new Error(`Tool '${toolName}' is not available.`);
  }
  await tool.authorize(ctx);
  if (WRITE_TOOL_NAMES.has(toolName)) {
    if (!ctx.enableEdits) {
      throw new Error("File modifications are disabled for this agent run.");
    }
    if (!ctx.runId) {
      throw new Error("Workspace run context is required for write tools.");
    }
  }
  if (EXECUTION_TOOL_NAMES.has(toolName)) {
    if (!ctx.enableVerification) {
      throw new Error("Sandbox verification is disabled for this agent run.");
    }
    if (!ctx.runId) {
      throw new Error("Workspace run context is required for execution tools.");
    }
  }
  if (GIT_TOOL_NAMES.has(toolName)) {
    if (!ctx.enableGitWorkflow) {
      throw new Error("Git workflow is disabled for this agent run.");
    }
    if (!ctx.runId) {
      throw new Error("Workspace run context is required for git tools.");
    }
  }
  try {
    const output = await tool.execute(ctx, input);
    if (ctx.runId) {
      await agentAuditService.record({
        agentRunId: ctx.runId,
        organizationId: ctx.organizationId,
        userId: ctx.userId,
        tool: toolName,
        path: typeof input.path === "string" ? input.path : undefined,
        input,
        output,
      });
    }
    return output;
  } catch (err: unknown) {
    if (err instanceof GitHubExplorerError) {
      throw new Error(err.message);
    }
    throw err;
  }
}

export function formatToolCatalogForPrompt(): string {
  return listAgentTools()
    .map((t) => `- ${t.name}: ${t.description}`)
    .join("\n");
}
