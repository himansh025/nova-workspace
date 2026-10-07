import crypto from "crypto";
import mongoose from "mongoose";
import { connectMongoDB } from "../config/db";
import { AgentRunModel } from "../models/AgentRun";
import {
  assertPublishPreconditions,
  buildPullRequestBody,
  agentGithubPublishService,
  __setGithubApiClientForTests,
  __setPushExecutorForTests,
  __setVerifyRepositoryForTests,
} from "../services/ai/agent/agentGithubPublishService";

async function main() {
  console.log("🚀 NOVA GITHUB PUBLISH (PHASE 8) TEST SUITE\n");
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
  const baseRun = {
    id: runId,
    task: "Fix checkout calculation",
    enableGitWorkflow: true,
    enableVerification: true,
    verificationStatus: "passed",
    gitWorkflowStatus: "committed",
    gitCommitSha: "abc123",
    gitBranch: "nova/agent/test-branch",
    modifiedFiles: ["src/checkout.ts"],
    lastExecution: { tool: "run_tests", success: true, exitCode: 0 },
  } as any;

  try {
    assertPublishPreconditions(baseRun);
    assert(true, "Preconditions pass when ready");
  } catch {
    assert(false, "Preconditions pass when ready");
  }

  let blocked = false;
  try {
    assertPublishPreconditions({ ...baseRun, verificationStatus: "failed" });
  } catch {
    blocked = true;
  }
  assert(blocked, "Publish blocked without verification");

  const body = buildPullRequestBody(baseRun, "{}");
  assert(body.includes(runId) && body.includes("Tests executed"), "PR body includes run id and tests");

  await connectMongoDB();
  const org = `org-gh-${Date.now()}`;
  const user = `user-gh-${crypto.randomUUID()}`;

  __setVerifyRepositoryForTests(async () => ({
    repository: {
      fullName: "acme/checkout",
      owner: "acme",
      name: "checkout",
      defaultBranch: "main",
    },
    token: "ghs_test_token",
  }));

  await AgentRunModel.create({
    ...baseRun,
    organizationId: org,
    userId: user,
    repositoryId: "repo-test-1",
    status: "ANALYZING",
    plan: [],
    discoveredFiles: [],
    relevantFiles: [],
    iterationCount: 0,
    enableEdits: true,
    editMode: "approval",
    workspaceInitialized: true,
    selfFixIterationCount: 0,
    enableGithubPublish: true,
    publishMode: "pr",
    publishStatus: "idle",
    tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, toolCalls: 0, iterations: 0 },
  });

  __setPushExecutorForTests(async () => ({
    exitCode: 1,
    stdout: "",
    stderr: "remote: Permission to repo denied (403)",
  }));

  let pushFailed = false;
  try {
    await agentGithubPublishService.pushBranch(runId, org, user);
  } catch (e: any) {
    pushFailed = /permission/i.test(e.message);
  }
  assert(pushFailed, "Push permission failure surfaced");

  __setPushExecutorForTests(async () => ({
    exitCode: 1,
    stdout: "",
    stderr: "rejected non-fast-forward",
  }));
  await AgentRunModel.updateOne({ id: runId }, { publishStatus: "idle", publishError: undefined });
  let conflict = false;
  try {
    await agentGithubPublishService.pushBranch(runId, org, user);
  } catch (e: any) {
    conflict = /conflict|rejected/i.test(e.message);
  }
  assert(conflict, "Branch conflict detected");

  __setPushExecutorForTests(async () => ({
    exitCode: 0,
    stdout: "ok",
    stderr: "",
  }));

  await AgentRunModel.updateOne(
    { id: runId },
    { publishStatus: "idle", publishError: undefined, githubPushSha: undefined }
  );

  const push1 = await agentGithubPublishService.pushBranch(runId, org, user);
  assert(!push1.idempotent, "First push not idempotent");
  const push2 = await agentGithubPublishService.pushBranch(runId, org, user);
  assert(push2.idempotent, "Second push idempotent");

  await AgentRunModel.updateOne(
    { id: runId },
    { pullRequestNumber: 42, pullRequestUrl: "https://github.com/o/r/pull/42", publishStatus: "pr_created" }
  );
  const dup = await agentGithubPublishService.createPullRequest(runId, org, user);
  assert(dup.idempotent && dup.number === 42, "Duplicate PR prevented");

  await AgentRunModel.updateOne(
    { id: runId },
    {
      $unset: { pullRequestNumber: "", pullRequestUrl: "" },
      publishStatus: "pushed",
      publishError: "",
    }
  );

  __setGithubApiClientForTests({
    fetch: async (url, init) => {
      const u = String(url);
      if (u.includes("/pulls?")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (init?.method === "POST" && u.endsWith("/pulls")) {
        return new Response(
          JSON.stringify({ number: 99, html_url: "https://github.com/o/r/pull/99", title: "t" }),
          { status: 201 }
        );
      }
      return new Response("not found", { status: 404 });
    },
  });

  const pr = await agentGithubPublishService.createPullRequest(runId, org, user);
  assert(pr.number === 99 && pr.publishStatus === "pr_created", "PR created", String(pr.number));

  __setGithubApiClientForTests({
    fetch: async (url, init) => {
      if (String(url).includes("/pulls?")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (init?.method === "POST") {
        return new Response("error", { status: 500 });
      }
      return new Response("error", { status: 500 });
    },
  });
  await AgentRunModel.updateOne(
    { id: runId },
    { $unset: { pullRequestNumber: "", pullRequestUrl: "" }, publishStatus: "pushed" }
  );
  let apiFail = false;
  try {
    await agentGithubPublishService.createPullRequest(runId, org, user);
  } catch (e: any) {
    apiFail = /GitHub API failure/i.test(e.message);
  }
  assert(apiFail, "GitHub API failure handled");

  let authFail = false;
  try {
    await agentGithubPublishService.pushBranch(runId, org, "wrong-user");
  } catch {
    authFail = true;
  }
  assert(authFail, "Repository/run authorization (user isolation)");

  await AgentRunModel.deleteOne({ id: runId });
  await mongoose.disconnect();
  __setGithubApiClientForTests(null);
  __setPushExecutorForTests(null);
  __setVerifyRepositoryForTests(null);

  console.log(`\nResults: ${passed}/${total}`);
  if (passed !== total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
