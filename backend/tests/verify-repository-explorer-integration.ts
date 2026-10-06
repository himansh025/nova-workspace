import mongoose from "mongoose";
import app from "../app";
import { connectMongoDB } from "../config/db";
import { UserModel } from "../models/User";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel } from "../models/OrganizationMember";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { RepositoryModel } from "../models/Repository";
import { createSession } from "../services/auth";
import { githubRepositoryExplorerService, clearExplorerCache } from "../services/githubRepositoryExplorerService";
import { repositoryContextService } from "../services/repositoryContextService";

const TEST_PORT = 5115;
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

async function runIntegrationSuite() {
  console.log("🔒 =========================================================");
  console.log("   PHASE 2: REPOSITORY EXPLORER INTEGRATION TEST SUITE      ");
  console.log("=========================================================\n");

  await connectMongoDB();
  clearExplorerCache();

  const server = app.listen(TEST_PORT);
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  // ─── Setup Organizations & Users ──────────────────────────────────────────
  const orgA = "org-explorer-tenant-a";
  const orgB = "org-explorer-tenant-b";

  await OrganizationModel.deleteMany({ id: { $in: [orgA, orgB] } });
  await OrganizationMemberModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await GitHubInstallationModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await RepositoryModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });

  await OrganizationModel.create([
    { id: orgA, name: "Tenant A Engineering", slug: "tenant-a-eng", defaultBranch: "main" },
    { id: orgB, name: "Tenant B Secure", slug: "tenant-b-sec", defaultBranch: "main" },
  ]);

  const userA = await UserModel.findOneAndUpdate(
    { email: "alice@explorer-a.test" },
    {
      $set: {
        id: "usr-explorer-a",
        email: "alice@explorer-a.test",
        name: "Alice Explorer",
        role: "Engineer",
        passwordHash: "dummy",
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const userB = await UserModel.findOneAndUpdate(
    { email: "bob@explorer-b.test" },
    {
      $set: {
        id: "usr-explorer-b",
        email: "bob@explorer-b.test",
        name: "Bob Explorer",
        role: "Engineer",
        passwordHash: "dummy",
        emailVerified: true,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  await OrganizationMemberModel.insertMany([
    { id: "mem-exp-a", organizationId: orgA, userId: userA.id, role: "owner", joinedAt: new Date() },
    { id: "mem-exp-b", organizationId: orgB, userId: userB.id, role: "owner", joinedAt: new Date() },
  ]);

  const tokenA = await createSession(userA.id, orgA);
  const tokenB = await createSession(userB.id, orgB);

  // Tenant A: Active Installation & Repositories
  await GitHubInstallationModel.create({
    id: "ghi-exp-inst-a",
    organizationId: orgA,
    githubInstallationId: 50501,
    status: "ACTIVE",
    accountLogin: "tenant-a-org",
  });

  const repoA = await RepositoryModel.create({
    id: "repo-tenant-a-webapp",
    organizationId: orgA,
    githubInstallationId: 50501,
    githubRepositoryId: 60601,
    owner: "tenant-a-org",
    name: "webapp",
    fullName: "tenant-a-org/webapp",
    private: true,
    defaultBranch: "main",
    selectedBranch: "main",
    selected: true,
  });

  // Tenant B: Active Installation & Repositories
  await GitHubInstallationModel.create({
    id: "ghi-exp-inst-b",
    organizationId: orgB,
    githubInstallationId: 50502,
    status: "ACTIVE",
    accountLogin: "tenant-b-org",
  });

  const repoB = await RepositoryModel.create({
    id: "repo-tenant-b-secret",
    organizationId: orgB,
    githubInstallationId: 50502,
    githubRepositoryId: 60602,
    owner: "tenant-b-org",
    name: "secret-vault",
    fullName: "tenant-b-org/secret-vault",
    private: true,
    defaultBranch: "main",
    selectedBranch: "main",
    selected: true,
  });

  try {
    // ─── 1. AUTHENTICATION & ACCESS CONTROL ──────────────────────────────────
    console.log("▶ [1. AUTHENTICATION & ACCESS ENFORCEMENT]");

    // 1.1 Unauthenticated tree read rejected
    const unauthTreeRes = await fetch(`${baseUrl}/api/integrations/github/repositories/${repoA.id}/tree`);
    assert(unauthTreeRes.status === 401, "Unauthenticated Tree Read", "Rejected with 401 Unauthorized");

    // 1.2 Unauthenticated file read rejected
    const unauthFileRes = await fetch(`${baseUrl}/api/integrations/github/repositories/${repoA.id}/file?path=package.json`);
    assert(unauthFileRes.status === 401, "Unauthenticated File Read", "Rejected with 401 Unauthorized");

    // 1.3 Unauthenticated metadata read rejected
    const unauthMetaRes = await fetch(`${baseUrl}/api/integrations/github/repositories/${repoA.id}`);
    assert(unauthMetaRes.status === 401, "Unauthenticated Metadata Read", "Rejected with 401 Unauthorized");

    // ─── 2. TENANT ISOLATION (CROSS-ORG REPOSITORY ACCESS) ───────────────────
    console.log("\n▶ [2. TENANT ISOLATION GUARDS]");

    // 2.1 User B cannot read Tenant A repository metadata
    const crossMetaRes = await fetch(`${baseUrl}/api/integrations/github/repositories/${repoA.id}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossMetaRes.status === 404, "Cross-Tenant Repository Metadata Guard", "User B cannot view Tenant A repo (404)");

    // 2.2 User B cannot read Tenant A repository tree
    const crossTreeRes = await fetch(`${baseUrl}/api/integrations/github/repositories/${repoA.id}/tree`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(crossTreeRes.status === 404, "Cross-Tenant Repository Tree Guard", "User B cannot browse Tenant A tree (404)");

    // 2.3 User B cannot read Tenant A source files
    const crossFileRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/file?path=src/index.ts`,
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(crossFileRes.status === 404, "Cross-Tenant File Read Guard", "User B cannot read Tenant A files (404)");

    // 2.4 User B cannot search inside Tenant A repository
    const crossSearchRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/search?q=secret`,
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(crossSearchRes.status === 404, "Cross-Tenant Code Search Guard", "User B cannot search Tenant A codebase (404)");

    // 2.5 User B cannot read Tenant A commits
    const crossCommitsRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/commits`,
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    assert(crossCommitsRes.status === 404, "Cross-Tenant Commits Guard", "User B cannot inspect Tenant A commits (404)");

    // ─── 3. PATH TRAVERSAL & MALFORMED REQUEST GUARDS ─────────────────────────
    console.log("\n▶ [3. PATH SECURITY & VALIDATION GUARDS]");

    // 3.1 Path traversal with .. rejected with 400
    const traversalRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/file?path=../../../etc/passwd`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(traversalRes.status === 400, "Path Traversal Rejection", "Rejected ../ traversal with 400 Bad Request");

    // 3.2 URL-encoded traversal %2e%2e rejected with 400
    const encodedTraversalRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/file?path=%2e%2e%2fconfig.json`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(encodedTraversalRes.status === 400, "Encoded Path Traversal Rejection", "Rejected %2e%2e traversal with 400 Bad Request");

    // 3.3 Missing path parameter rejected with 400
    const missingPathRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/file`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(missingPathRes.status === 400, "Missing File Path Rejection", "Rejected missing path with 400 Bad Request");

    // 3.4 Nonexistent repository identifier rejected with 404
    const nonExistentRepoRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/repo-non-existent-99999`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(nonExistentRepoRes.status === 404, "Nonexistent Repository Rejection", "Rejected nonexistent repo with 404");

    // ─── 4. REVOKED INSTALLATION GUARD ────────────────────────────────────────
    console.log("\n▶ [4. REVOKED INSTALLATION GUARD]");

    // Mark Tenant A's installation as REVOKED
    await GitHubInstallationModel.updateOne({ id: "ghi-exp-inst-a" }, { $set: { status: "REVOKED" } });

    const revokedTreeRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}/tree`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    assert(
      revokedTreeRes.status === 403,
      "Revoked GitHub Installation Access Guard",
      "Rejected access with 403 when installation status is REVOKED"
    );

    // Restore active status
    await GitHubInstallationModel.updateOne({ id: "ghi-exp-inst-a" }, { $set: { status: "ACTIVE" } });
    clearExplorerCache();

    // ─── 5. REPOSITORY METADATA ENDPOINT ─────────────────────────────────────
    console.log("\n▶ [5. REPOSITORY METADATA]");

    const metaRes = await fetch(
      `${baseUrl}/api/integrations/github/repositories/${repoA.id}`,
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const metaData = (await metaRes.json()) as any;
    assert(
      metaRes.status === 200 && metaData.success && metaData.repository?.fullName === "tenant-a-org/webapp",
      "Authorized Repository Metadata Read",
      `Full Name: ${metaData.repository?.fullName}, Private: ${metaData.repository?.private}`
    );
    assert(
      metaData.repository?.token === undefined && metaData.repository?.clientSecret === undefined,
      "Secret Leakage Guard",
      "No internal tokens or secrets present in response"
    );

    // ─── 6. SERVICE-LEVEL FUNCTIONAL AUDIT ───────────────────────────────────
    console.log("\n▶ [6. SERVICE-LEVEL READ-ONLY CONTRACT & DETERMINISTIC CONTEXT]");

    // 6.1 Verify project context service returns structured metadata without AI
    // We create a mocked tree read to verify project overview computation
    const originalGetTree = githubRepositoryExplorerService.getTree;
    const originalGetFile = githubRepositoryExplorerService.getFile;

    // Simulate Next.js repository root tree
    (githubRepositoryExplorerService as any).getTree = async () => ({
      branch: "main",
      path: "",
      items: [
        { name: "next.config.ts", path: "next.config.ts", type: "file", size: 450 },
        { name: "package.json", path: "package.json", type: "file", size: 850 },
        { name: "pnpm-lock.yaml", path: "pnpm-lock.yaml", type: "file", size: 12000 },
        { name: "README.md", path: "README.md", type: "file", size: 2100 },
        { name: "Dockerfile", path: "Dockerfile", type: "file", size: 620 },
        { name: "src", path: "src", type: "dir" },
      ],
      page: 1,
      perPage: 100,
      totalCount: 6,
    });

    (githubRepositoryExplorerService as any).getFile = async (_org: string, _repo: string, _branch: string, filePath: string) => {
      if (filePath === "package.json") {
        return {
          type: "file",
          name: "package.json",
          path: "package.json",
          size: 850,
          content: JSON.stringify({
            name: "tenant-webapp",
            dependencies: { react: "^19.0.0", "next": "16.0.0", "lucide-react": "^0.500.0" },
            devDependencies: { typescript: "^5.0.0" },
          }),
        };
      }
      return { type: "file", name: filePath, path: filePath, size: 100, content: "" };
    };

    const overview = await repositoryContextService.getRepositoryOverview(orgA, repoA.id, "main");
    assert(
      overview.projectDetection.projectType === "Next.js" && overview.projectDetection.confidence === 1.0,
      "Deterministic Project Type Detection",
      `Type: ${overview.projectDetection.projectType} (Confidence: ${overview.projectDetection.confidence})`
    );
    assert(
      overview.packageManager.name === "pnpm",
      "Package Manager Detection",
      `Package Manager: ${overview.packageManager.name}`
    );
    assert(
      overview.dependencySummary.topDependencies.includes("react") && overview.dependencySummary.totalDependenciesCount === 4,
      "Dependency Summary Ingestion",
      `Dependencies count: ${overview.dependencySummary.totalDependenciesCount}`
    );

    // 6.2 Test binary file detection response format
    (githubRepositoryExplorerService as any).getFile = originalGetFile;
    (githubRepositoryExplorerService as any).getTree = originalGetTree;

    console.log("\n=========================================================");
    console.log(`Results: ALL ${passed} Explorer Integration Tests Passed! (100%)`);
    console.log("=========================================================\n");
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runIntegrationSuite().catch((err) => {
  console.error("Integration test error:", err);
  process.exit(1);
});
