import fs from "fs/promises";
import fssync from "fs";
import path from "path";
import { validateAgentFilePath } from "./agentPathUtils";
import { AGENT_CONFIG } from "./agentConfig";
import { githubRepositoryExplorerService } from "../../githubRepositoryExplorerService";
import { computeFileDiff, mergeDiffSummary, type IDiffSummary } from "./agentDiffService";

function getWorkspaceRoot(): string {
  return path.resolve(
    process.env.AGENT_WORKSPACE_ROOT || path.join(process.cwd(), "agent-run")
  );
}

export function getWorkspaceDir(runId: string): string {
  if (!/^agent-[0-9a-f-]{36}$/i.test(runId)) {
    throw new Error("Invalid agent run id.");
  }
  return path.join(getWorkspaceRoot(), runId);
}

async function ensureInsideWorkspace(runId: string, relativePath: string): Promise<string> {
  const safeRel = validateAgentFilePath(relativePath);
  const root = getWorkspaceDir(runId);
  const target = path.resolve(root, safeRel);

  if (!target.startsWith(root + path.sep) && target !== root) {
    throw new Error("Path escapes workspace boundary.");
  }

  const rootReal = await fs.realpath(root).catch(() => root);
  const parent = path.dirname(target);
  await fs.mkdir(parent, { recursive: true });
  const targetReal = await fs.realpath(parent).catch(() => parent);
  const resolved = path.resolve(targetReal, path.basename(target));

  if (!resolved.startsWith(rootReal + path.sep) && resolved !== rootReal) {
    throw new Error("Symlink or path escape detected.");
  }

  return resolved;
}

export async function initWorkspace(params: {
  runId: string;
  organizationId: string;
  repositoryId: string;
  branch: string;
}): Promise<{ filesHydrated: number; bytesHydrated: number }> {
  const root = getWorkspaceDir(params.runId);
  await fs.mkdir(root, { recursive: true });

  let filesHydrated = 0;
  let bytesHydrated = 0;
  const queue: string[] = [""];
  const visited = new Set<string>();

  while (queue.length > 0 && filesHydrated < AGENT_CONFIG.workspaceMaxFiles) {
    const dir = queue.shift()!;
    if (visited.has(dir)) continue;
    visited.add(dir);

    const tree = await githubRepositoryExplorerService.getTree(
      params.organizationId,
      params.repositoryId,
      params.branch,
      dir || undefined,
      1,
      100
    );

    for (const item of tree.items) {
      if (item.type === "dir") {
        if (!visited.has(item.path)) queue.push(item.path);
        continue;
      }
      if (item.type !== "file") continue;
      if (filesHydrated >= AGENT_CONFIG.workspaceMaxFiles) break;
      if (bytesHydrated >= AGENT_CONFIG.workspaceMaxBytes) break;

      try {
        validateAgentFilePath(item.path);
      } catch {
        continue;
      }

      const file = await githubRepositoryExplorerService.getFile(
        params.organizationId,
        params.repositoryId,
        params.branch,
        item.path
      );
      if (file.type !== "file" || !file.content) continue;

      const size = Buffer.byteLength(file.content, "utf8");
      if (size > AGENT_CONFIG.workspaceMaxFileBytes) continue;
      if (bytesHydrated + size > AGENT_CONFIG.workspaceMaxBytes) continue;

      const abs = await ensureInsideWorkspace(params.runId, item.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, file.content, "utf8");
      filesHydrated += 1;
      bytesHydrated += size;
    }
  }

  return { filesHydrated, bytesHydrated };
}

export async function readWorkspaceFile(
  runId: string,
  relativePath: string
): Promise<{ exists: boolean; content?: string }> {
  const abs = await ensureInsideWorkspace(runId, relativePath);
  try {
    const stat = await fs.lstat(abs);
    if (stat.isSymbolicLink()) {
      throw new Error("Symlink access denied.");
    }
    if (!stat.isFile()) {
      return { exists: false };
    }
    const content = await fs.readFile(abs, "utf8");
    return { exists: true, content };
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { exists: false };
    }
    throw err;
  }
}

export async function writeWorkspaceFile(
  runId: string,
  relativePath: string,
  content: string,
  options?: { allowFullReplace?: boolean; existingContent?: string | null }
): Promise<{ diff: ReturnType<typeof computeFileDiff>; summary: IDiffSummary }> {
  if (Buffer.byteLength(content, "utf8") > AGENT_CONFIG.workspaceMaxFileBytes) {
    throw new Error("File exceeds workspace size limit.");
  }

  const safeRel = validateAgentFilePath(relativePath);
  const abs = await ensureInsideWorkspace(runId, safeRel);
  const prior = await readWorkspaceFile(runId, safeRel);
  const before = prior.exists ? prior.content || "" : "";

  if (prior.exists && !options?.allowFullReplace && before.length > 500) {
    throw new Error(
      "Full file replacement blocked for existing files. Use apply_patch instead."
    );
  }

  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");

  const fileDiff = computeFileDiff(safeRel, before, content);
  const summary = mergeDiffSummary(emptySummary(), fileDiff.summary);
  return { diff: fileDiff, summary };
}

export async function applyWorkspacePatch(
  runId: string,
  relativePath: string,
  patch: string
): Promise<{ diff: ReturnType<typeof computeFileDiff>; summary: IDiffSummary; content: string }> {
  const { applyUnifiedPatch } = await import("./agentPatchUtils");
  const safeRel = validateAgentFilePath(relativePath);
  const prior = await readWorkspaceFile(runId, safeRel);
  const before = prior.exists ? prior.content || "" : "";
  const after = applyUnifiedPatch(before, patch);

  if (Buffer.byteLength(after, "utf8") > AGENT_CONFIG.workspaceMaxFileBytes) {
    throw new Error("Patched file exceeds size limit.");
  }

  const abs = await ensureInsideWorkspace(runId, safeRel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, after, "utf8");

  const fileDiff = computeFileDiff(safeRel, before, after);
  return { diff: fileDiff, summary: mergeDiffSummary(emptySummary(), fileDiff.summary), content: after };
}

export async function deleteWorkspaceFile(
  runId: string,
  relativePath: string
): Promise<{ diff: ReturnType<typeof computeFileDiff>; summary: IDiffSummary }> {
  const safeRel = validateAgentFilePath(relativePath);
  const abs = await ensureInsideWorkspace(runId, safeRel);
  const prior = await readWorkspaceFile(runId, safeRel);
  const before = prior.exists ? prior.content || "" : "";
  await fs.unlink(abs).catch((err: NodeJS.ErrnoException) => {
    if (err.code !== "ENOENT") throw err;
  });
  const fileDiff = computeFileDiff(safeRel, before, "");
  fileDiff.summary.filesDeleted = 1;
  return { diff: fileDiff, summary: mergeDiffSummary(emptySummary(), fileDiff.summary) };
}

export async function renameWorkspaceFile(
  runId: string,
  fromPath: string,
  toPath: string
): Promise<{ from: string; to: string; summary: IDiffSummary }> {
  const fromRel = validateAgentFilePath(fromPath);
  const toRel = validateAgentFilePath(toPath);
  const fromAbs = await ensureInsideWorkspace(runId, fromRel);
  const toAbs = await ensureInsideWorkspace(runId, toRel);

  const prior = await readWorkspaceFile(runId, fromRel);
  if (!prior.exists) {
    throw new Error("Source file does not exist in workspace.");
  }

  await fs.mkdir(path.dirname(toAbs), { recursive: true });
  await fs.rename(fromAbs, toAbs);

  const summary: IDiffSummary = {
    filesAdded: 0,
    filesModified: 1,
    filesDeleted: 0,
    linesAdded: 0,
    linesRemoved: 0,
    fileDiffs: [
      {
        path: toRel,
        status: "renamed",
        linesAdded: 0,
        linesRemoved: 0,
        unifiedDiff: `rename from ${fromRel}\nrename to ${toRel}`,
      },
    ],
  };
  return { from: fromRel, to: toRel, summary };
}

export function emptySummary(): IDiffSummary {
  return {
    filesAdded: 0,
    filesModified: 0,
    filesDeleted: 0,
    linesAdded: 0,
    linesRemoved: 0,
    fileDiffs: [],
  };
}

export async function collectWorkspaceDiff(runId: string): Promise<IDiffSummary> {
  const root = getWorkspaceDir(runId);
  if (!fssync.existsSync(root)) {
    return emptySummary();
  }
  // Baseline snapshots stored alongside workspace
  const baselinePath = path.join(root, ".nova-baseline.json");
  let baseline: Record<string, string> = {};
  try {
    baseline = JSON.parse(await fs.readFile(baselinePath, "utf8"));
  } catch {
    return emptySummary();
  }

  let summary = emptySummary();
  for (const [rel, before] of Object.entries(baseline)) {
    const current = await readWorkspaceFile(runId, rel);
    const after = current.exists ? current.content || "" : "";
    if (after !== before) {
      const fd = computeFileDiff(rel, before, after);
      summary = mergeDiffSummary(summary, fd.summary);
    }
  }

  // New files not in baseline
  async function walk(dir: string, rel = ""): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith(".nova-")) continue;
      const relPath = rel ? `${rel}/${ent.name}` : ent.name;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full, relPath);
      } else if (ent.isFile() && !(relPath in baseline)) {
        const content = await fs.readFile(full, "utf8");
        const fd = computeFileDiff(relPath, "", content);
        fd.summary.filesAdded = 1;
        summary = mergeDiffSummary(summary, fd.summary);
      }
    }
  }
  await walk(root);
  return summary;
}

export async function saveWorkspaceBaseline(runId: string): Promise<void> {
  const root = getWorkspaceDir(runId);
  const baseline: Record<string, string> = {};

  async function walk(dir: string, rel = ""): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name.startsWith(".nova-")) continue;
      const relPath = rel ? `${rel}/${ent.name}` : ent.name;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full, relPath);
      } else if (ent.isFile()) {
        baseline[relPath] = await fs.readFile(full, "utf8");
      }
    }
  }

  if (fssync.existsSync(root)) {
    await walk(root);
  }
  await fs.writeFile(path.join(root, ".nova-baseline.json"), JSON.stringify(baseline), "utf8");
}

export async function destroyWorkspace(runId: string): Promise<void> {
  const root = getWorkspaceDir(runId);
  await fs.rm(root, { recursive: true, force: true });
}
