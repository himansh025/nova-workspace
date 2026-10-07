import { AGENT_CONFIG } from "./agentConfig";

const DIFF_FIRST_TOOLS = new Set([
  "get_workspace_diff",
  "git_diff",
  "apply_patch",
  "create_commit",
]);

export function compressToolResult(toolName: string, output: unknown): unknown {
  if (output === null || output === undefined) return output;

  if (typeof output === "object" && (output as { requiresApproval?: boolean }).requiresApproval) {
    return output;
  }

  if (DIFF_FIRST_TOOLS.has(toolName) && typeof output === "object") {
    const o = output as Record<string, unknown>;
    if (o.unifiedDiff || o.staged || o.summary || o.diffPreview) {
      return {
        compressed: true,
        tool: toolName,
        summary: o.summary || {
          linesAdded: o.linesAdded,
          linesRemoved: o.linesRemoved,
        },
        diffPreview: String(o.diffPreview || o.staged || o.unifiedDiff || "").slice(
          0,
          AGENT_CONFIG.toolDiffPreviewChars
        ),
      };
    }
  }

  if (toolName === "read_file" && typeof output === "object") {
    const o = output as { path?: string; content?: string; startLine?: number; endLine?: number };
    const content = o.content || "";
    return {
      path: o.path,
      startLine: o.startLine,
      endLine: o.endLine,
      contentPreview: content.slice(0, AGENT_CONFIG.toolFilePreviewChars),
      truncated: content.length > AGENT_CONFIG.toolFilePreviewChars,
    };
  }

  if (toolName === "search_code" && typeof output === "object") {
    const o = output as { items?: Array<{ path: string }>; totalCount?: number };
    return {
      query: (o as any).query,
      totalCount: o.totalCount,
      paths: (o.items || []).slice(0, 15).map((i) => i.path),
    };
  }

  if (toolName === "list_files" && typeof output === "object") {
    const o = output as { items?: Array<{ path: string; type: string }> };
    return {
      path: (o as any).path,
      items: (o.items || []).slice(0, 40).map((i) => `${i.type}:${i.path}`),
    };
  }

  if (toolName === "run_tests" || toolName === "run_build" || toolName === "run_linter") {
    const o = output as Record<string, unknown>;
    return {
      success: o.success,
      exitCode: o.exitCode,
      durationMs: o.durationMs,
      errorSummary: String(o.errorSummary || "").slice(0, 1500),
      stdoutPreview: String(o.stdoutPreview || "").slice(0, 800),
    };
  }

  const json = JSON.stringify(output);
  if (json.length <= AGENT_CONFIG.compressedToolMaxChars) return output;
  return {
    compressed: true,
    tool: toolName,
    preview: json.slice(0, AGENT_CONFIG.compressedToolMaxChars),
    originalLength: json.length,
  };
}
