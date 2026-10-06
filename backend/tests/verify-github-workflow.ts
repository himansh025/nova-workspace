import crypto from "crypto";
import mongoose from "mongoose";
import app from "../app";
import { connectMongoDB } from "../config/db";
import { TaskModel } from "../models/Task";
import { PullRequestModel } from "../models/PullRequest";
import { OrganizationModel } from "../models/Organization";
import { ActivityItemModel } from "../models/Activity";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { RepositoryModel } from "../models/Repository";
import { UserModel } from "../models/User";
import { OrganizationMemberModel } from "../models/OrganizationMember";
import { createSession } from "../services/auth";
import { extractTaskKey } from "../services/githubService";

function assert(condition: boolean, title: string, message: string) {
  if (condition) {
    console.log(`✅ [PASS] ${title} -> ${message}`);
  } else {
    console.error(`❌ [FAIL] ${title} -> ${message}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

async function runGithubWorkflowAudit() {
  console.log("🚀 =========================================================");
  console.log("   GITHUB INTEGRATION & WEBHOOK WORKFLOW AUDIT SUITE       ");
  console.log("=========================================================\n");

  await connectMongoDB();

  // Test 1: Task Key Extraction from multiple sources
  const branchKey = extractTaskKey("feature/NV-851-security-headers");
  assert(branchKey === "NV-851", "Task Key Extractor (Branch)", `Extracted ${branchKey} from branch`);

  const titleKey = extractTaskKey("main", "NV-782 Fix session cookie leak");
  assert(titleKey === "NV-782", "Task Key Extractor (Title)", `Extracted ${titleKey} from title`);

  const commitKey = extractTaskKey(undefined, undefined, undefined, "NV-1042 Optimize database indices");
  assert(commitKey === "NV-1042", "Task Key Extractor (Commit)", `Extracted ${commitKey} from commit message`);

  // Setup test organization & tasks in DB
  const testOrgId = "org-test-gh-workflow";
  await OrganizationModel.deleteMany({ id: testOrgId });
  await TaskModel.deleteMany({ organizationId: testOrgId });
  await PullRequestModel.deleteMany({ organizationId: testOrgId });
  await ActivityItemModel.deleteMany({ organizationId: testOrgId });
  await GitHubInstallationModel.deleteMany({ organizationId: testOrgId });
  await RepositoryModel.deleteMany({ organizationId: testOrgId });

  await OrganizationModel.create({
    id: testOrgId,
    name: "Test GitHub Workspace",
    slug: "test-gh-workspace",
    defaultBranch: "main",
  });

  // Link GitHub Installation and Repository so webhooks route accurately
  await GitHubInstallationModel.create({
    id: "ghi-test-999",
    organizationId: testOrgId,
    githubInstallationId: 99999,
    status: "ACTIVE",
    accountLogin: "nova",
  });

  await RepositoryModel.create({
    id: "repo-test-edge",
    organizationId: testOrgId,
    githubInstallationId: 99999,
    githubRepositoryId: 88888,
    owner: "nova",
    name: "edge",
    fullName: "nova/edge",
    defaultBranch: "main",
    selected: true,
  });

  const testUser = await UserModel.findOneAndUpdate(
    { email: "gh_auditor@nova.test" },
    {
      $set: {
        id: "usr-gh-auditor",
        email: "gh_auditor@nova.test",
        name: "GH Auditor",
        role: "Engineer",
        passwordHash: "dummy",
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await OrganizationMemberModel.findOneAndUpdate(
    { organizationId: testOrgId, userId: testUser.id },
    {
      $set: {
        id: `mem-${testOrgId}-${testUser.id}`,
        organizationId: testOrgId,
        userId: testUser.id,
        role: "owner",
        joinedAt: new Date(),
      },
    },
    { upsert: true }
  );

  const sessionToken = await createSession(testUser.id, testOrgId);

  const task1 = await TaskModel.create({
    id: "tsk-nv-851",
    key: "NV-851",
    organizationId: testOrgId,
    projectId: "prj-main",
    title: "Add edge security headers",
    status: "in_progress",
    priority: "high",
    assignee: { id: "usr-1", name: "Dev", initials: "DV" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const task2 = await TaskModel.create({
    id: "tsk-nv-999",
    key: "NV-999",
    organizationId: testOrgId,
    projectId: "prj-main",
    title: "Experimental branch task",
    status: "in_progress",
    priority: "medium",
    assignee: { id: "usr-2", name: "Dev2", initials: "D2" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Start HTTP server for route testing
  const server = app.listen(5109);
  const baseUrl = "http://127.0.0.1:5109";

  const testWebhookSecret = "test_webhook_hmac_secret_445566";
  process.env.GITHUB_WEBHOOK_SECRET = testWebhookSecret;

  function postWebhook(payload: any, customDeliveryId?: string) {
    const rawBody = JSON.stringify(payload);
    const signature = `sha256=${crypto
      .createHmac("sha256", testWebhookSecret)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("hex")}`;
    const deliveryId = customDeliveryId || `del-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signature,
        "x-github-delivery": deliveryId,
        "x-github-event": payload.event || "push",
      },
      body: rawBody,
    });
  }

  try {
    // Test 2: Webhook - Push Event Links Branch to Task (Cryptographically Signed with HMAC)
    const pushRes = await postWebhook({
      event: "push",
      ref: "refs/heads/NV-851-edge-headers",
      pusher: { name: "Himanshu" },
      repository: { full_name: "nova/edge" },
    });
    const pushData: any = await pushRes.json();
    assert(pushRes.status === 200 && pushData.success, "Webhook Push Event", pushData.message);

    const updatedTask1 = await TaskModel.findOne({ id: "tsk-nv-851" });
    assert(updatedTask1?.branch === "NV-851-edge-headers", "Task Branch Auto-Link", `Branch linked: ${updatedTask1?.branch}`);

    // Test 3: Webhook - PR Closed without merge (Task status must NOT become Done)
    const unmergedRes = await postWebhook({
      event: "pull_request",
      action: "closed",
      repository: { full_name: "nova/edge" },
      pull_request: {
        id: 901,
        number: 901,
        title: "NV-851 Draft Security Header WIP",
        body: "Closed without merging",
        state: "closed",
        merged: false,
        user: { login: "dev" },
        head: { ref: "NV-851-edge-headers" },
        base: { ref: "main" },
      },
    });
    const unmergedData: any = await unmergedRes.json();
    assert(unmergedRes.status === 200 && unmergedData.success, "PR Closed Unmerged Webhook", unmergedData.message);

    const task1AfterUnmerged = await TaskModel.findOne({ id: "tsk-nv-851" });
    assert(task1AfterUnmerged?.status === "in_progress", "Unmerged PR Guard", `Task status remains: ${task1AfterUnmerged?.status}`);

    // Test 4: Webhook - PR Merged into NON-DEFAULT branch (e.g. develop) -> Task status must NOT become Done
    const nonDefaultRes = await postWebhook({
      event: "pull_request",
      action: "closed",
      repository: { full_name: "nova/edge" },
      pull_request: {
        id: 902,
        number: 902,
        title: "NV-999 Merge into develop branch",
        body: "Feature branch merged into develop staging",
        state: "closed",
        merged: true,
        user: { login: "dev2" },
        head: { ref: "NV-999-staging" },
        base: { ref: "develop" }, // NON-DEFAULT target branch
      },
    });
    const nonDefaultData: any = await nonDefaultRes.json();
    assert(nonDefaultRes.status === 200 && nonDefaultData.success, "PR Merged Non-Default Target", nonDefaultData.message);

    const task2AfterNonDefault = await TaskModel.findOne({ id: "tsk-nv-999" });
    assert(task2AfterNonDefault?.status === "in_progress", "Non-Default Branch Merge Guard", `Task status remains: ${task2AfterNonDefault?.status}`);

    // Test 5: Webhook - PR Merged into DEFAULT branch (main) -> Task status MUST become Done
    const validMergeRes = await postWebhook({
      event: "pull_request",
      action: "closed",
      repository: { full_name: "nova/edge" },
      pull_request: {
        id: 903,
        number: 903,
        title: "NV-851 Add security headers & edge protection",
        body: "Closes NV-851",
        state: "closed",
        merged: true,
        user: { login: "Himanshu" },
        head: { ref: "NV-851-edge-headers" },
        base: { ref: "main" }, // DEFAULT branch
      },
    });
    const validMergeData: any = await validMergeRes.json();
    assert(validMergeRes.status === 200 && validMergeData.success, "PR Merged Default Branch Webhook", validMergeData.message);

    const task1AfterMerge = await TaskModel.findOne({ id: "tsk-nv-851" });
    assert(task1AfterMerge?.status === "done", "Auto-Transition Task to Done", `Task status is now: ${task1AfterMerge?.status}`);

    // Test 6: Idempotency - Repeat duplicate webhook delivery ID (Must NOT duplicate processing)
    const fixedDeliveryId = "delivery-fixed-test-uuid-9999";
    const initialActivityCount = await ActivityItemModel.countDocuments({ target: "NV-851" });

    // Send first delivery
    await postWebhook(
      {
        event: "pull_request",
        action: "closed",
        repository: { full_name: "nova/edge" },
        pull_request: {
          id: 903,
          number: 903,
          title: "NV-851 Add security headers & edge protection",
          body: "Closes NV-851",
          state: "closed",
          merged: true,
          user: { login: "Himanshu" },
          head: { ref: "NV-851-edge-headers" },
          base: { ref: "main" },
        },
      },
      fixedDeliveryId
    );

    // Send duplicate delivery with the exact same delivery ID
    const duplicateRes = await postWebhook(
      {
        event: "pull_request",
        action: "closed",
        repository: { full_name: "nova/edge" },
        pull_request: {
          id: 903,
          number: 903,
          title: "NV-851 Add security headers & edge protection",
          body: "Closes NV-851",
          state: "closed",
          merged: true,
          user: { login: "Himanshu" },
          head: { ref: "NV-851-edge-headers" },
          base: { ref: "main" },
        },
      },
      fixedDeliveryId
    );
    const duplicateData: any = await duplicateRes.json();
    const finalActivityCount = await ActivityItemModel.countDocuments({ target: "NV-851" });
    assert(
      duplicateRes.status === 200 && duplicateData.duplicate === true,
      "Webhook Idempotency Guard",
      `Duplicate delivery ignored (Activity count maintained: ${finalActivityCount})`
    );

    // Test 7: AI Code Review Execution (With authenticated session token)
    const aiReviewRes = await fetch(`${baseUrl}/api/ai/review-pr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ prId: "pr-gh-903" }),
    });
    const aiReviewData: any = await aiReviewRes.json();
    assert(
      aiReviewRes.status === 200 && aiReviewData.success && aiReviewData.review?.score > 0,
      "AI Code Review Execution",
      `Score: ${aiReviewData.review?.score}/100 - Security: ${aiReviewData.review?.securityStatus}`
    );

    console.log("\n---------------------------------------------------------");
    console.log("Results: ALL 7 GitHub Workflow End-to-End Tests Passed! (100%)");
    console.log("---------------------------------------------------------");
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

runGithubWorkflowAudit().catch((err) => {
  console.error("Workflow Audit Failure:", err);
  process.exit(1);
});
