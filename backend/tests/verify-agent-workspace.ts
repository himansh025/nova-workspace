import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
process.env.AGENT_WORKSPACE_ROOT = path.join(os.tmpdir(), `nova-agent-test-${Date.now()}`);

import {
  writeWorkspaceFile,
  applyWorkspacePatch,
  deleteWorkspaceFile,
  renameWorkspaceFile,
  getWorkspaceDir,
  destroyWorkspace,
  saveWorkspaceBaseline,
  collectWorkspaceDiff,
} from "../services/ai/agent/agentWorkspaceService";
import { validateAgentFilePath } from "../services/ai/agent/agentPathUtils";
import { applyUnifiedPatch } from "../services/ai/agent/agentPatchUtils";
import { computeFileDiff } from "../services/ai/agent/agentDiffService";

async function run() {
  console.log("🛠️  NOVA AGENT WORKSPACE (PHASE 5) TEST SUITE\n");
  let passed = 0;
  let total = 0;
  const assert = (c: boolean, name: string, d?: string) => {
    total++;
    if (c) {
      console.log(`✅ [PASS] ${name}${d ? ` -> ${d}` : ""}`);
      passed++;
    } else console.error(`❌ [FAIL] ${name}${d ? ` -> ${d}` : ""}`);
  };

  const runId = `agent-${crypto.randomUUID()}`;

  // Path validation
  let blocked = false;
  try {
    validateAgentFilePath("../../etc/passwd");
  } catch {
    blocked = true;
  }
  assert(blocked, "Path traversal blocked");

  // Patch utils
  const patched = applyUnifiedPatch("hello world", "<<<SEARCH\nhello\n===\nhi\n>>>");
  assert(patched === "hi world", "Search/replace patch applied");

  const root = getWorkspaceDir(runId);
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src/a.ts"), "const x = 1;\n", "utf8");
  await saveWorkspaceBaseline(runId);

  const w = await writeWorkspaceFile(runId, "src/new.ts", "export const y = 2;\n", {
    allowFullReplace: true,
  });
  assert(w.summary.filesAdded === 1, "write_file tracks added file");

  const ap = await applyWorkspacePatch(
    runId,
    "src/a.ts",
    "<<<SEARCH\nconst x = 1;\n===\nconst x = 2;\n>>>"
  );
  assert(ap.summary.linesAdded + ap.summary.linesRemoved > 0, "apply_patch produces diff stats");

  await renameWorkspaceFile(runId, "src/a.ts", "src/b.ts");
  const renamed = await fs.readFile(path.join(root, "src/b.ts"), "utf8");
  assert(renamed.includes("x = 2"), "rename_file works");

  await deleteWorkspaceFile(runId, "src/new.ts");
  let exists = true;
  try {
    await fs.access(path.join(root, "src/new.ts"));
  } catch {
    exists = false;
  }
  assert(!exists, "delete_file removes file");

  const diff = await collectWorkspaceDiff(runId);
  assert(diff.fileDiffs.length >= 1, "Workspace diff collected", String(diff.fileDiffs.length));

  const fd = computeFileDiff("f.ts", "a\n", "a\nb\n");
  assert(fd.fileDiff.linesAdded >= 1, "Diff line stats");

  // Workspace boundary
  blocked = false;
  try {
    const outside = path.resolve(root, "..", "escape.ts");
    await fs.writeFile(outside, "bad", "utf8");
    await writeWorkspaceFile(runId, "../escape.ts", "nope", { allowFullReplace: true });
  } catch {
    blocked = true;
  }
  assert(blocked, "Outside workspace write blocked");

  await destroyWorkspace(runId);
  let destroyed = false;
  try {
    await fs.stat(root);
  } catch {
    destroyed = true;
  }
  assert(destroyed, "Workspace destroyed");

  console.log(`\nResults: ${passed}/${total}`);
  if (passed !== total) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
