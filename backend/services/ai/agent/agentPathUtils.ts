import { normalizeAndValidatePath } from "../../githubRepositoryExplorerService";

const BLOCKED_PREFIXES = [
  ".git/",
  ".env",
  "node_modules/",
  ".ssh/",
  "/etc/",
  "/proc/",
  "/sys/",
];

const BLOCKED_EXACT = new Set([
  ".git",
  ".gitignore",
  ".gitattributes",
  ".env",
  ".env.local",
  ".env.production",
]);

/**
 * Validates repository-relative paths for agent read_file (no traversal, no secrets paths).
 */
export function validateAgentFilePath(rawPath: unknown): string {
  if (typeof rawPath !== "string" || !rawPath.trim()) {
    throw new Error("File path is required.");
  }

  const trimmed = rawPath.trim();
  if (trimmed.startsWith("/") || /^[a-zA-Z]:\\/.test(trimmed)) {
    throw new Error("Absolute paths are not allowed.");
  }

  const normalized = normalizeAndValidatePath(trimmed);
  if (!normalized) {
    throw new Error("Invalid file path.");
  }

  const lower = normalized.toLowerCase();
  if (BLOCKED_EXACT.has(lower)) {
    throw new Error("Access to this path is denied.");
  }
  for (const prefix of BLOCKED_PREFIXES) {
    if (lower === prefix.replace(/\/$/, "") || lower.startsWith(prefix)) {
      throw new Error("Access to this path is denied.");
    }
  }

  return normalized;
}

export function sliceFileContent(
  content: string,
  startLine?: number,
  endLine?: number,
  maxLines = 400
): { content: string; startLine: number; endLine: number; truncated: boolean } {
  const lines = content.split("\n");
  const total = lines.length;

  let start = typeof startLine === "number" && startLine > 0 ? Math.floor(startLine) : 1;
  let end =
    typeof endLine === "number" && endLine > 0
      ? Math.floor(endLine)
      : Math.min(total, start + maxLines - 1);

  if (start > total) {
    start = total;
  }
  if (end < start) {
    end = start;
  }

  let truncated = false;
  if (end - start + 1 > maxLines) {
    end = start + maxLines - 1;
    truncated = true;
  }

  const slice = lines.slice(start - 1, end);
  return {
    content: slice.join("\n"),
    startLine: start,
    endLine: end,
    truncated: truncated || end < total,
  };
}
