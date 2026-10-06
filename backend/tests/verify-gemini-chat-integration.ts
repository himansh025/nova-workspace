import mongoose from "mongoose";
import { ENV } from "../config/env";
import { aiSettingsService } from "../services/aiSettingsService";
import { aiService } from "../services/aiService";
import { aiRepositoryContextBuilder } from "../services/ai/aiRepositoryContextBuilder";
import { githubAppService } from "../services/githubAppService";
import { githubRepositoryExplorerService, clearExplorerCache } from "../services/githubRepositoryExplorerService";
import { AIConversationModel } from "../models/AIConversation";
import { AIMessageModel } from "../models/AIMessage";
import { RepositoryModel } from "../models/Repository";
import { GitHubInstallationModel } from "../models/GitHubInstallation";

function assert(condition: boolean, title: string, message?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${title}${message ? ` -> ${message}` : ""}`);
  } else {
    console.error(`❌ [FAIL] ${title}${message ? ` -> ${message}` : ""}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

async function runChatIntegrationTests() {
  console.log("🧪 =========================================================");
  console.log("   PHASE 3: GEMINI AI CHAT & ISOLATION INTEGRATION TESTS   ");
  console.log("=========================================================\n");

  await mongoose.connect(ENV.MONGODB_URI);
  console.log("Connected to MongoDB successfully.\n");

  const orgA = "org-gemini-test-a";
  const orgB = "org-gemini-test-b";
  const userA = "user-gemini-a";
  const userB = "user-gemini-b";

  // Pre-test cleanup
  await AIConversationModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await AIMessageModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await RepositoryModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  await GitHubInstallationModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });

  const origIsConfigured = githubAppService.isConfigured;
  const origCreateInstallationToken = githubAppService.createInstallationToken;
  const origGetTree = githubRepositoryExplorerService.getTree;
  const origGetFile = githubRepositoryExplorerService.getFile;

  try {
    // ─── 1. AI SETTINGS & CREDENTIAL ENCRYPTION ─────────────────────────────
    console.log("▶ [1. AI SETTINGS & CREDENTIAL ENCRYPTION]");

    const rawTestKey = "AIzaSyDummyGeminiApiKeyForTesting123456789";
    await aiSettingsService.saveSettings({
      organizationId: orgA,
      provider: "google",
      apiKey: rawTestKey,
      selectedModel: "gemini-2.5-flash",
    });

    const settingsA = await aiSettingsService.getSettings(orgA);
    assert(settingsA.configured === true, "Org A AI is marked configured");
    assert(settingsA.selectedModel === "gemini-2.5-flash", "Selected model matches");
    assert(settingsA.hasKey === true, "Key presence flag is true");
    assert(settingsA.maskedKey !== rawTestKey, "Raw key is NEVER returned directly", settingsA.maskedKey);
    assert(settingsA.maskedKey.includes("••••••••"), "Key is masked with bullets");

    const decrypted = await aiSettingsService.getDecryptedApiKey(orgA);
    assert(decrypted?.apiKey === rawTestKey, "Decrypted key matches raw key on server-side");

    const settingsB = await aiSettingsService.getSettings(orgB);
    assert(settingsB.configured === false, "Org B AI is unconfigured (Tenant Isolation)");
    assert(settingsB.hasKey === false, "Org B has no key");

    // ─── 2. CONVERSATION MANAGEMENT & SESSIONS ──────────────────────────────
    console.log("\n▶ [2. CONVERSATION MANAGEMENT & SESSIONS]");

    const conv1 = await aiService.createConversation(orgA, userA, {
      title: "Architecture Planning",
      model: "gemini-2.5-pro",
    });

    assert(conv1.id.startsWith("conv-"), "Generated conversation ID with conv- prefix", conv1.id);
    assert(conv1.title === "Architecture Planning", "Conversation title set correctly");
    assert(conv1.selectedModel === "gemini-2.5-pro", "Model stored as gemini-2.5-pro");

    const convList = await aiService.listConversations(orgA, userA);
    assert(convList.length >= 1, "Listed conversations for Org A User A");
    assert(convList.some((c) => c.id === conv1.id), "Created conversation found in list");

    const loaded = await aiService.getConversation(orgA, userA, conv1.id);
    assert(loaded.conversation.id === conv1.id, "Retrieved conversation by ID");
    assert(Array.isArray(loaded.messages), "Conversation contains messages array");

    // ─── 3. MULTI-TENANT ISOLATION (ORG B CANNOT ACCESS ORG A) ─────────────
    console.log("\n▶ [3. MULTI-TENANT ISOLATION SECURITY]");

    try {
      await aiService.getConversation(orgB, userB, conv1.id);
      assert(false, "Org B should NOT be able to access Org A conversation");
    } catch (err: any) {
      assert(err.message === "Conversation not found.", "Org B access rejected with 404", err.message);
    }

    const orgBList = await aiService.listConversations(orgB, userB);
    assert(!orgBList.some((c) => c.id === conv1.id), "Org B list contains zero Org A conversations");

    const deletedByWrongOrg = await aiService.deleteConversation(orgB, userB, conv1.id);
    assert(deletedByWrongOrg === false, "Org B cannot delete Org A conversation");

    // ─── 4. REPOSITORY CONTEXT BUILDER & SECRET SANITIZATION ────────────────
    console.log("\n▶ [4. REPOSITORY CONTEXT BUILDER]");

    // Seed test repository and installation for Org A
    const testInstallation = await GitHubInstallationModel.create({
      id: "inst-test-gemini-1",
      organizationId: orgA,
      githubInstallationId: 888999,
      accountLogin: "nova-test-org",
      accountType: "Organization",
      status: "ACTIVE",
      permissions: { contents: "read", metadata: "read" },
    });

    const testRepo = await RepositoryModel.create({
      id: "repo-test-gemini-1",
      organizationId: orgA,
      githubInstallationId: 888999,
      githubRepositoryId: 999111,
      owner: "nova-test-org",
      name: "secure-service",
      fullName: "nova-test-org/secure-service",
      defaultBranch: "main",
      selectedBranch: "main",
      htmlUrl: "https://github.com/nova-test-org/secure-service",
      private: true,
      archived: false,
      selected: true,
    });

    // Mock GitHub installation token & file retrieval for bounded context test
    (githubAppService as any).isConfigured = () => true;
    (githubAppService as any).createInstallationToken = async () => "mock-gh-installation-token";
    (githubRepositoryExplorerService as any).getTree = async () => ({
      path: "",
      branch: "main",
      totalCount: 2,
      page: 1,
      pageSize: 100,
      hasMore: false,
      items: [
        { name: "package.json", path: "package.json", type: "file", size: 500 },
        { name: "src", path: "src", type: "dir" },
      ],
    });

    (githubRepositoryExplorerService as any).getFile = async (
      _orgId: string,
      _repoId: string,
      _branch: string,
      path: string
    ) => {
      if (path === "package.json") {
        return {
          type: "file",
          path: "package.json",
          name: "package.json",
          size: 200,
          content: JSON.stringify({
            name: "secure-service",
            dependencies: { express: "^4.19.2", mongodb: "^6.0.0" },
          }),
        };
      }
      if (path === "src/config.ts") {
        return {
          type: "file",
          path: "src/config.ts",
          name: "config.ts",
          size: 300,
          content: "export const DB_URI = 'mongodb://root:TopSecretDbPass123@db.internal:27017/prod';",
        };
      }
      return null;
    };

    const contextResult = await aiRepositoryContextBuilder.buildContext({
      organizationId: orgA,
      repositoryId: testRepo.id,
      branch: "main",
      filePaths: ["src/config.ts"],
      includeOverview: true,
    });

    assert(typeof contextResult.contextBlock === "string", "Generated contextBlock");
    assert(
      contextResult.contextBlock.includes("=== UNTRUSTED REPOSITORY CONTEXT START ==="),
      "Untrusted boundary wrapper included at start"
    );
    assert(
      contextResult.contextBlock.includes("=== UNTRUSTED REPOSITORY CONTEXT END ==="),
      "Untrusted boundary wrapper included at end"
    );
    assert(
      contextResult.metadata.repositoryName === "nova-test-org/secure-service",
      "Provenance tracks repositoryFullName"
    );
    assert(contextResult.metadata.branch === "main", "Provenance tracks branch");
    assert(Array.isArray(contextResult.metadata.sources), "Provenance tracks source files");
    assert(contextResult.metadata.sources.length === 1, "Tracked 1 attached source file");
    assert(contextResult.metadata.sources[0].path === "src/config.ts", "Tracked source file path");
    assert(!contextResult.contextBlock.includes("TopSecretDbPass123"), "Database password redacted from attached file");
    assert(contextResult.metadata.redactedCount > 0, "Redaction count recorded in metadata");

    // ─── 5. CLEANUP CASCADE ON CONVERSATION DELETION ────────────────────────
    console.log("\n▶ [5. CONVERSATION DELETION CASCADE]");

    // Add a message to conv1
    await AIMessageModel.create({
      id: "msg-test-delete-1",
      conversationId: conv1.id,
      organizationId: orgA,
      userId: userA,
      role: "user",
      content: "Hello Gemini",
    });

    const deleteSuccess = await aiService.deleteConversation(orgA, userA, conv1.id);
    assert(deleteSuccess === true, "Conversation deleted successfully by Org A owner");

    const remainingMessages = await AIMessageModel.find({ conversationId: conv1.id });
    assert(remainingMessages.length === 0, "All associated messages deleted via cascade");

    // Cleanup test data
    await RepositoryModel.deleteOne({ id: testRepo.id });
    await GitHubInstallationModel.deleteOne({ githubInstallationId: 888999 });
    await AIConversationModel.deleteMany({ organizationId: { $in: [orgA, orgB] } });

    console.log("\n🎉 ALL PHASE 3 GEMINI INTEGRATION TESTS PASSED!\n");
  } finally {
    // Restore mocks
    githubAppService.isConfigured = origIsConfigured;
    githubAppService.createInstallationToken = origCreateInstallationToken;
    githubRepositoryExplorerService.getTree = origGetTree;
    githubRepositoryExplorerService.getFile = origGetFile;
    clearExplorerCache();
    await mongoose.disconnect();
  }
}

runChatIntegrationTests().catch((err) => {
  console.error("FATAL INTEGRATION TEST FAILURE:", err);
  process.exit(1);
});
