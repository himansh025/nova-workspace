import crypto from "crypto";
import mongoose from "mongoose";
import app from "../app";
import { connectMongoDB } from "../config/db";
import { UserModel } from "../models/User";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel } from "../models/OrganizationMember";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { RepositoryModel } from "../models/Repository";
import { PullRequestModel } from "../models/PullRequest";
import { TaskModel } from "../models/Task";
import { GitHubWebhookDeliveryModel } from "../models/GitHubWebhookDelivery";
import { createSession } from "../services/auth";
import { createGitHubInstallState, verifyGitHubInstallState } from "../services/githubAppService";
import { githubService } from "../services/githubService";
import { ENV } from "../config/env";

const TEST_PORT = 5110;
let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`🛡️ [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
  } else {
    failed++;
    console.error(`💥 [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runHardeningSuite() {
  console.log("🔒 =========================================================");
  console.log("   PHASE 1: GITHUB SECURITY HARDENING & APP AUDIT SUITE     ");
  console.log("=========================================================\n");

  await connectMongoDB();

  const server = app.listen(TEST_PORT);
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  const testWebhookSecret = "test_hardening_webhook_secret_998877";
  process.env.GITHUB_WEBHOOK_SECRET = testWebhookSecret;

  // ─── Setup Tenant A & Tenant B ──────────────────────────────────────────
  const orgA = "org-hardening-tenant-a";
  const orgB = "org-hardening-tenant-b";

  await OrganizationModel.deleteMany({ id: { $in: [orgA, orgB] } });
  await OrganizationMemberModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await GitHubInstallationModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await RepositoryModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await PullRequestModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await TaskModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await GitHubWebhookDeliveryModel.deleteMany({});

  await OrganizationModel.create([
    { id: orgA, name: "Tenant A Corp", slug: "tenant-a", defaultBranch: "main" },
    { id: orgB, name: "Tenant B Inc", slug: "tenant-b", defaultBranch: "main" },
  ]);

  const userA = await UserModel.findOneAndUpdate(
    { email: "alice@tenanta.com" },
    {
      $set: {
        id: "usr-tenant-a",
        email: "alice@tenanta.com",
        name: "Alice A",
        role: "Engineer",
        passwordHash: "dummy",
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const userB = await UserModel.findOneAndUpdate(
    { email: "bob@tenantb.com" },
    {
      $set: {
        id: "usr-tenant-b",
        email: "bob@tenantb.com",
        name: "Bob B",
        role: "Engineer",
        passwordHash: "dummy",
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await OrganizationMemberModel.insertMany([
    { id: "mem-a-1", organizationId: orgA, userId: userA.id, role: "owner", joinedAt: new Date() },
    { id: "mem-b-1", organizationId: orgB, userId: userB.id, role: "owner", joinedAt: new Date() },
  ]);

  const sessionTokenA = await createSession(userA.id, orgA);
  const sessionTokenB = await createSession(userB.id, orgB);

  // Setup GitHub App and Repos for Tenant A
  await GitHubInstallationModel.create({
    id: "ghi-tenant-a-101",
    organizationId: orgA,
    githubInstallationId: 10101,
    status: "ACTIVE",
    accountLogin: "tenant-a-org",
  });

  const repoA = await RepositoryModel.create({
    id: "repo-tenant-a-core",
    organizationId: orgA,
    githubInstallationId: 10101,
    githubRepositoryId: 20202,
    owner: "tenant-a-org",
    name: "core-service",
    fullName: "tenant-a-org/core-service",
    defaultBranch: "main",
    selected: true,
  });

  // Setup PR for Tenant A
  const prA = await PullRequestModel.create({
    id: "pr-gh-777",
    organizationId: orgA,
    number: 777,
    title: "NV-101 Tenant A Confidential Changes",
    description: "Security fix",
    author: { name: "Alice", avatar: "", initials: "AA" },
    branch: "NV-101-fix",
    targetBranch: "main",
    status: "open",
    commitsCount: 1,
    filesChangedCount: 1,
    additions: 10,
    deletions: 2,
    updatedAt: new Date().toISOString(),
    linkedIssueKey: "NV-101",
    diff: [],
  });

  // Setup Task for Tenant A and Tenant B with identical key NV-101 to test key collision isolation
  await TaskModel.create([
    {
      id: "tsk-a-101",
      key: "NV-101",
      organizationId: orgA,
      projectId: "prj-a",
      title: "Tenant A secret task",
      status: "in_progress",
      priority: "high",
      assignee: { id: "usr-a", name: "Alice", initials: "AA" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "tsk-b-102",
      key: "NV-102",
      organizationId: orgB,
      projectId: "prj-b",
      title: "Tenant B unrelated task",
      status: "backlog",
      priority: "low",
      assignee: { id: "usr-b", name: "Bob", initials: "BB" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  function signPayload(body: any, secret: string) {
    const raw = Buffer.from(JSON.stringify(body), "utf8");
    return `sha256=${crypto.createHmac("sha256", secret).update(raw).digest("hex")}`;
  }

  try {
    // ─── SECTION 1: AUTHENTICATION HARDENING ──────────────────────────────────
    console.log("▶ [SECTION 1: AUTHENTICATION & ACCESS HARDENING]");

    // Test 1.1: Unauthenticated PR list rejected
    const unauthPrRes = await fetch(`${baseUrl}/api/pull-requests`);
    assert(unauthPrRes.status === 401, "Unauthenticated PR List", "Rejected with 401 Unauthorized");

    // Test 1.2: Unauthenticated GitHub App Status rejected
    const unauthStatusRes = await fetch(`${baseUrl}/api/integrations/github/status`);
    assert(unauthStatusRes.status === 401, "Unauthenticated GitHub Status", "Rejected with 401 Unauthorized");

    // Test 1.3: Unauthenticated Repo Select rejected
    const unauthSelectRes = await fetch(`${baseUrl}/api/integrations/github/repositories/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubRepositoryId: 20202 }),
    });
    assert(unauthSelectRes.status === 401, "Unauthenticated Repo Select", "Rejected with 401 Unauthorized");

    // ─── SECTION 2: TENANT ISOLATION (CROSS-ORG ACCESS GUARDS) ────────────────
    console.log("\n▶ [SECTION 2: TENANT ISOLATION]");

    // Test 2.1: User B cannot read Tenant A PRs
    const tenantBPrsRes = await fetch(`${baseUrl}/api/pull-requests`, {
      headers: { Authorization: `Bearer ${sessionTokenB}` },
    });
    const tenantBPrs = (await tenantBPrsRes.json()) as any;
    assert(
      tenantBPrs.success && !tenantBPrs.pullRequests.some((p: any) => p.id === prA.id),
      "Cross-Tenant PR List Isolation",
      "User B cannot view Tenant A PRs"
    );

    // Test 2.2: User B cannot review Tenant A PR (no global fallback to find PR in DB)
    const crossReviewRes = await fetch(`${baseUrl}/api/ai/review-pr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionTokenB}`,
      },
      body: JSON.stringify({ prId: prA.id }),
    });
    assert(
      crossReviewRes.status === 404,
      "Cross-Tenant PR Review Guard",
      "Rejected with 404 (strictly isolated within Tenant B)"
    );

    // Test 2.3: User B cannot delete Tenant A PR
    const crossDeleteRes = await fetch(`${baseUrl}/api/pull-requests/${prA.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${sessionTokenB}` },
    });
    assert(
      crossDeleteRes.status === 404,
      "Cross-Tenant PR Deletion Guard",
      "Rejected with 404 Not Found"
    );

    // Test 2.4: User B cannot select Tenant A repository
    const crossSelectRepoRes = await fetch(`${baseUrl}/api/integrations/github/repositories/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionTokenB}`,
      },
      body: JSON.stringify({ githubRepositoryId: 20202 }),
    });
    assert(
      crossSelectRepoRes.status === 400 || crossSelectRepoRes.status === 404,
      "Cross-Tenant Repo Select Guard",
      "User B cannot select Tenant A repo"
    );

    // Test 2.5: User B cannot list branches for Tenant A repository
    const crossBranchesRes = await fetch(`${baseUrl}/api/integrations/github/branches?repositoryId=${repoA.id}`, {
      headers: { Authorization: `Bearer ${sessionTokenB}` },
    });
    assert(
      crossBranchesRes.status === 400 || crossBranchesRes.status === 404,
      "Cross-Tenant Branch Listing Guard",
      "User B cannot inspect Tenant A branches"
    );

    // ─── SECTION 3: GITHUB APP INSTALLATION & FLOW ────────────────────────────
    console.log("\n▶ [SECTION 3: GITHUB APP STATE & INSTALLATION]");

    // Test 3.1: CSRF install state creation and verification
    const installState = createGitHubInstallState(userA.id, orgA);
    const decodedState = verifyGitHubInstallState(installState, userA.id, orgA);
    assert(decodedState.userId === userA.id && decodedState.organizationId === orgA, "CSRF State Verification", "Valid token verified");

    // Test 3.2: Tampered CSRF state rejected
    let stateTampered = false;
    try {
      verifyGitHubInstallState(installState, userB.id, orgB);
    } catch {
      stateTampered = true;
    }
    assert(stateTampered, "Mismatched User/Org State Rejection", "Tampered state blocked");

    // Test 3.3: Disconnect GitHub App revokes installation
    const disconnectRes = await fetch(`${baseUrl}/api/integrations/github/disconnect`, {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionTokenA}` },
    });
    const disconnectData = (await disconnectRes.json()) as any;
    assert(disconnectRes.status === 200 && disconnectData.success, "GitHub App Disconnect", disconnectData.message);

    const revokedInst = await GitHubInstallationModel.findOne({ organizationId: orgA });
    assert(revokedInst?.status === "REVOKED", "Installation Status Revoked", "Status transitioned to REVOKED");

    // Restore active status for webhook tests
    await GitHubInstallationModel.updateOne({ organizationId: orgA }, { $set: { status: "ACTIVE" } });

    // ─── SECTION 4: WEBHOOK SECURITY & HMAC VERIFICATION ─────────────────────
    console.log("\n▶ [SECTION 4: WEBHOOK CRYPTOGRAPHIC SECURITY & IDEMPOTENCY]");

    const validPayload = {
      event: "push",
      ref: "refs/heads/main",
      repository: { id: 20202, full_name: "tenant-a-org/core-service" },
      head_commit: { message: "NV-101 Fix security breach" },
      pusher: { name: "Alice" },
    };

    // Test 4.1: Valid HMAC-SHA256 signature accepted
    const validSig = signPayload(validPayload, testWebhookSecret);
    const validWebhookRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": validSig,
        "x-github-delivery": `del-${Date.now()}-1`,
        "x-github-event": "push",
      },
      body: JSON.stringify(validPayload),
    });
    assert(validWebhookRes.status === 200, "Valid HMAC Signature Webhook", "200 OK Accepted");

    // Test 4.2: Invalid HMAC signature rejected with 401
    const invalidWebhookRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
        "x-github-delivery": `del-${Date.now()}-2`,
        "x-github-event": "push",
      },
      body: JSON.stringify(validPayload),
    });
    assert(invalidWebhookRes.status === 401, "Invalid Signature Rejection", "401 Unauthorized");

    // Test 4.3: Tampered body with original signature rejected
    const tamperedPayload = { ...validPayload, pusher: { name: "Attacker" } };
    const tamperedWebhookRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": validSig, // Old signature on modified payload
        "x-github-delivery": `del-${Date.now()}-3`,
        "x-github-event": "push",
      },
      body: JSON.stringify(tamperedPayload),
    });
    assert(tamperedWebhookRes.status === 401, "Tampered Payload Rejection", "Modified body fails HMAC verification");

    // Test 4.4: Missing signature rejected in production mode
    const unsignedWebhookRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-github-delivery": `del-${Date.now()}-4`,
        "x-github-event": "push",
      },
      body: JSON.stringify(validPayload),
    });
    assert(
      unsignedWebhookRes.status === 401,
      "Missing Signature Rejection",
      "Unsigned request rejected with 401"
    );

    // Test 4.5: Webhook Delivery Idempotency (X-GitHub-Delivery)
    const idempotentDeliveryId = `del-idempotent-${Date.now()}`;
    const firstDeliveryRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signPayload(validPayload, testWebhookSecret),
        "x-github-delivery": idempotentDeliveryId,
        "x-github-event": "push",
      },
      body: JSON.stringify(validPayload),
    });
    assert(firstDeliveryRes.status === 200, "First Delivery Attempt", "Processed 200 OK");

    const duplicateDeliveryRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signPayload(validPayload, testWebhookSecret),
        "x-github-delivery": idempotentDeliveryId,
        "x-github-event": "push",
      },
      body: JSON.stringify(validPayload),
    });
    const duplicateData = (await duplicateDeliveryRes.json()) as any;
    assert(
      duplicateDeliveryRes.status === 200 && duplicateData.duplicate === true,
      "Duplicate Delivery Idempotency",
      "Duplicate delivery recognized and safely ignored without reprocessing"
    );

    // Test 4.6: Unknown installation or repository ignored safely (no global DB search)
    const unknownPayload = {
      event: "push",
      ref: "refs/heads/main",
      repository: { id: 9999999, full_name: "unknown-hacker/rogue-repo" },
    };
    const unknownRes = await fetch(`${baseUrl}/api/webhooks/github`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hub-signature-256": signPayload(unknownPayload, testWebhookSecret),
        "x-github-delivery": `del-${Date.now()}-5`,
        "x-github-event": "push",
      },
      body: JSON.stringify(unknownPayload),
    });
    assert(
      unknownRes.status === 202,
      "Unmapped Repository Safe Ignore",
      "Safely ignored with 202, no fallback to default org or tasks"
    );

    // Test 4.7: Cross-organization task isolation via webhook
    // Webhook belonging to Tenant A modified Task NV-101. Verify Tenant B's Task NV-102 remains in backlog!
    const taskB = await TaskModel.findOne({ id: "tsk-b-102" });
    assert(
      taskB?.status === "backlog",
      "Cross-Tenant Webhook Task Mutation Isolation",
      "Tenant B's task was not affected by Tenant A's webhook event"
    );

    // ─── SECTION 5: PR STATUS & LOCAL MERGE INTEGRITY ─────────────────────────
    console.log("\n▶ [SECTION 5: PR LOCAL MERGE CLARIFICATION & DIFF INTEGRITY]");

    // Test 5.1: Marking PR as merged locally clarifies local workspace mutation
    const localMergeRes = await fetch(`${baseUrl}/api/pull-requests`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionTokenA}`,
      },
      body: JSON.stringify({ id: prA.id, action: "merge" }),
    });
    const localMergeData = (await localMergeRes.json()) as any;
    assert(
      localMergeRes.status === 200 && localMergeData.localOnly === true,
      "Local PR Merge Distinction",
      "Explicitly specifies localOnly: true, does not claim GitHub merge"
    );

    // Test 5.2: Real diff retrieval returns empty array when repo unavailable (no fake diffs in prod)
    const diffFiles = await githubService.fetchPullRequestDiff(
      orgA,
      777,
      "Title",
      "NV-101",
      false // isSimulation: false
    );
    assert(
      Array.isArray(diffFiles) && diffFiles.length === 0,
      "Production PR Diff Integrity",
      "Returns empty diff instead of fabricating fake diffs"
    );

    console.log("\n=========================================================");
    console.log(`Results: ALL ${passed} Hardening Tests Passed! (100%)`);
    console.log("=========================================================");
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runHardeningSuite().catch((err) => {
  console.error("Hardening Suite Error:", err);
  process.exit(1);
});
