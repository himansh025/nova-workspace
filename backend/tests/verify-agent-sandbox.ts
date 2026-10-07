process.env.AGENT_SANDBOX_MODE = "mock";
process.env.AGENT_WORKSPACE_ROOT = require("path").join(
  require("os").tmpdir(),
  `nova-sandbox-test-${Date.now()}`
);

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  buildAllowlistedCommand,
  assertCommandAllowlisted,
} from "../services/ai/agent/executionPolicyService";
import {
  summarizeExecutionOutput,
  truncateOutput,
} from "../services/ai/agent/executionOutputService";
import { sandboxExecutorService } from "../services/ai/agent/sandboxExecutorService";
import { getWorkspaceDir } from "../services/ai/agent/agentWorkspaceService";
import { agentSelfFixService } from "../services/ai/agent/agentSelfFixService";
import { AGENT_CONFIG } from "../services/ai/agent/agentConfig";

async function run() {
  console.log("🧪 NOVA AGENT SANDBOX (PHASE 6) TEST SUITE\n");
  let passed = 0;
  let total = 0;
  const assert = (c: boolean, name: string, d?: string) => {
    total++;
    if (c) {
      console.log(`✅ [PASS] ${name}${d ? ` -> ${d}` : ""}`);
      passed++;
    } else console.error(`❌ [FAIL] ${name}${d ? ` -> ${d}` : ""}`);
  };

  const npmTest = buildAllowlistedCommand("npm", "test");
  assert(npmTest.argv[0] === "npm", "npm test allowlisted");
  const pnpmBuild = buildAllowlistedCommand("pnpm", "build");
  assert(pnpmBuild.shellLine.includes("pnpm"), "pnpm build allowlisted");

  let blocked = false;
  try {
    assertCommandAllowlisted(["bash", "-c", "rm -rf /"]);
  } catch {
    blocked = true;
  }
  assert(blocked, "Arbitrary command blocked");

  const big = "x".repeat(50_000);
  const truncated = truncateOutput(big, 1000);
  assert(truncated.length < big.length, "Output truncation");

  const summary = summarizeExecutionOutput({
    exitCode: 1,
    stdout: "ok",
    stderr: "Error: test failed\n    at Object.<anonymous> (/src/a.ts:1:1)",
    durationMs: 12,
  });
  assert(!summary.success && summary.errorSummary.length > 0, "Failure summary extracted");

  const runId = `agent-${crypto.randomUUID()}`;
  const root = getWorkspaceDir(runId);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "t", scripts: { test: "echo ok" } }),
    "utf8"
  );

  const ok = await sandboxExecutorService.runAllowlisted(runId, "test", "run_tests");
  assert(ok.success && ok.sandbox === "mock", "Mock sandbox success");

  await fs.writeFile(
    path.join(root, ".nova-sandbox-mock.json"),
    JSON.stringify({ exitCode: 1, stderr: "FAIL test" }),
    "utf8"
  );
  const fail = await sandboxExecutorService.runAllowlisted(runId, "test", "run_tests");
  assert(!fail.success, "Mock sandbox failure");

  const fakeRun = {
    enableEdits: true,
    selfFixIterationCount: 0,
    modifiedFiles: ["src/a.ts"],
    diffSummary: { linesAdded: 1, linesRemoved: 0, filesAdded: 0, filesModified: 1, filesDeleted: 0 },
    plan: [{ id: "step-1", description: "fix", status: "IN_PROGRESS", relevantFiles: [] }],
    currentStep: "step-1",
  } as any;

  assert(agentSelfFixService.shouldAttemptSelfFix(fakeRun, fail), "Self-fix allowed on failure");
  agentSelfFixService.recordSelfFixAttempt(fakeRun);
  assert(fakeRun.selfFixIterationCount === 1, "Self-fix iteration tracked");

  fakeRun.selfFixIterationCount = AGENT_CONFIG.maxSelfFixIterations;
  assert(!agentSelfFixService.shouldAttemptSelfFix(fakeRun, fail), "Self-fix max iterations");

  await fs.rm(root, { recursive: true, force: true });
  assert(true, "Workspace cleanup");

  console.log(`\nResults: ${passed}/${total}`);
  if (passed !== total) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
