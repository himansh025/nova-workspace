import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";
import { spawn } from "child_process";

process.env.AGENT_WORKSPACE_ROOT = path.join(os.tmpdir(), `nova-git-test-${Date.now()}`);

import {
  buildAgentBranchName,
  sanitizeBranchName,
  generateCommitMessage,
  ensureGitRepository,
  assertGitPreconditions,
} from "../services/ai/agent/gitWorkflowService";
import { getWorkspaceDir } from "../services/ai/agent/agentWorkspaceService";
import { connectMongoDB } from "../config/db";
import mongoose from "mongoose";
import { AgentRunModel } from "../models/AgentRun";
import { resolveRunLimits } from "../services/ai/agent/agentRunLimits";
import { gitWorkflowService } from "../services/ai/agent/gitWorkflowService";

async function runGit(cwd: string, args: string[]) {
  return new Promise<{ code: number; stdout: string }>((resolve, reject) => {
    const p = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.on("error", reject);
    p.on("close", (code) => resolve({ code: code ?? 1, stdout }));
  });
}

async function main() {
  console.log("🌿 NOVA AGENT GIT WORKFLOW (PHASE 7) TEST SUITE\n");
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
  const branch = buildAgentBranchName(runId, "Fix checkout calculation");
  assert(branch.startsWith("nova/agent/"), "Branch prefix", branch);
  assert(branch.includes("fix-checkout"), "Branch slug");

  let blocked = false;
  try {
    sanitizeBranchName("main");
  } catch {
    blocked = true;
  }
  assert(blocked, "main branch rejected");

  const safe = sanitizeBranchName("nova/agent/evil-branch");
  assert(safe.includes("evil-branch"), "Branch sanitization keeps safe segments");

  const msg = generateCommitMessage("Fix checkout\nDetails", runId);
  assert(msg.includes("feat(agent):") && msg.includes(runId), "Commit message from task");

  const root = getWorkspaceDir(runId);
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src/app.ts"), "export const v = 1;\n", "utf8");
  await ensureGitRepository(runId);

  const preFail = { verificationStatus: "failed", modifiedFiles: ["src/app.ts"], enableVerification: true } as any;
  let pre = false;
  try {
    assertGitPreconditions(preFail);
  } catch {
    pre = true;
  }
  assert(pre, "Git blocked when verification not passed");

  const preOk = { verificationStatus: "passed", modifiedFiles: ["src/app.ts"], enableVerification: true } as any;
  try {
    assertGitPreconditions(preOk);
    assert(true, "Git allowed when verification passed");
  } catch {
    assert(false, "Git allowed when verification passed");
  }

  let mongoReady = false;
  try {
    await connectMongoDB();
    mongoReady = mongoose.connection.readyState === 1;
  } catch {
    console.warn("[SKIP] MongoDB unavailable — commit integration skipped");
  }

  if (mongoReady) {
    const org = `org-git-${Date.now()}`;
    const user = `user-git-${crypto.randomUUID()}`;
    await AgentRunModel.create({
      id: runId,
      organizationId: org,
      userId: user,
      repositoryId: "repo-1",
      task: "Fix checkout calculation",
      status: "ANALYZING",
      plan: [],
      discoveredFiles: [],
      relevantFiles: [],
      modifiedFiles: ["src/app.ts"],
      iterationCount: 0,
      enableEdits: true,
      editMode: "approval",
      workspaceInitialized: true,
      enableVerification: true,
      verificationStatus: "passed",
      selfFixIterationCount: 0,
      enableGitWorkflow: true,
      gitWorkflowStatus: "idle",
      tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, toolCalls: 0, iterations: 0 },
      limits: resolveRunLimits(),
    });

    await fs.writeFile(path.join(root, "src/app.ts"), "export const v = 2;\n", "utf8");

    const created = await gitWorkflowService.createBranch(runId, org, user);
    assert(created.branch === branch, "create_branch", created.branch);

    const commit = await gitWorkflowService.createCommit(runId, org, user);
    assert(!!commit.commitSha && commit.commitSha.length >= 7, "create_commit SHA", commit.commitSha);

    const log = await runGit(root, ["log", "-1", "--oneline"]);
    assert(log.code === 0, "git log after commit");

    await AgentRunModel.deleteOne({ id: runId });
    await mongoose.disconnect();
  }

  await fs.rm(root, { recursive: true, force: true });

  console.log(`\nResults: ${passed}/${total}`);
  if (passed !== total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
