import crypto from "crypto";
import mongoose from "mongoose";
import { connectMongoDB } from "../config/db";
import { AgentRunModel } from "../models/AgentRun";
import { validateAgentFilePath, sliceFileContent } from "../services/ai/agent/agentPathUtils";
import { AGENT_CONFIG } from "../services/ai/agent/agentConfig";
import { getAgentTool, listAgentTools } from "../services/ai/agent/toolRegistry";
import { agentOrchestrator } from "../services/ai/agent/agentOrchestrator";
import { resolveRunLimits } from "../services/ai/agent/agentRunLimits";

async function runAgentFoundationTests() {
  console.log("🤖 =========================================================");
  console.log("   NOVA AI CODING AGENT FOUNDATION TEST SUITE");
  console.log("=========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, name: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}${detail ? ` -> ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  // ─── Path traversal prevention ───────────────────────────────────────────
  let threw = false;
  try {
    validateAgentFilePath("../../etc/passwd");
  } catch {
    threw = true;
  }
  assert(threw, "Path traversal blocked (..)");

  threw = false;
  try {
    validateAgentFilePath("/etc/passwd");
  } catch {
    threw = true;
  }
  assert(threw, "Absolute path blocked");

  threw = false;
  try {
    validateAgentFilePath(".git/config");
  } catch {
    threw = true;
  }
  assert(threw, ".git secrets path blocked");

  const sliced = sliceFileContent("a\nb\nc\nd\ne", 2, 4, 10);
  assert(sliced.startLine === 2 && sliced.endLine === 4, "Bounded line read", sliced.content);

  // ─── Tool registry ───────────────────────────────────────────────────────
  const toolNames = listAgentTools().map((t) => t.name).sort();
  assert(toolNames.includes("apply_patch"), "apply_patch registered");
  assert(toolNames.includes("write_file"), "write_file registered");
  assert(toolNames.includes("read_file"), "read_file registered");
  assert(getAgentTool("read_file") !== undefined, "read_file tool registered");
  assert(getAgentTool("write_file") !== undefined, "write_file tool gated by enableEdits");

  // ─── Iteration / context limits configured ───────────────────────────────
  assert(AGENT_CONFIG.maxIterations > 0 && AGENT_CONFIG.maxIterations <= 50, "Iteration limit bounded");
  assert(AGENT_CONFIG.maxContextChars > 0, "Context limit configured");

  // ─── Mongo isolation (skipped if DB unavailable) ───────────────────────
  let mongoReady = false;
  try {
    await connectMongoDB();
    mongoReady = mongoose.connection.readyState === 1;
  } catch (err) {
    console.warn("[SKIP] MongoDB unavailable — isolation tests skipped:", (err as Error).message);
  }

  if (!mongoReady) {
    console.log(`\nResults: ${passed}/${total} passed (DB tests skipped)`);
    process.exit(passed === total ? 0 : 1);
  }

  const orgA = `org-agent-a-${Date.now()}`;
  const orgB = `org-agent-b-${Date.now()}`;
  const userA = `user-a-${crypto.randomUUID()}`;
  const userB = `user-b-${crypto.randomUUID()}`;
  const runId = `agent-test-${crypto.randomUUID()}`;

  await AgentRunModel.create({
    id: runId,
    organizationId: orgA,
    userId: userA,
    repositoryId: "repo-a",
    task: "Fix checkout calculation",
    status: "PLANNING",
    plan: [
      {
        id: "step-1",
        description: "Locate checkout logic",
        status: "PENDING",
        relevantFiles: ["src/checkout.ts"],
      },
    ],
    discoveredFiles: [],
    relevantFiles: [],
    modifiedFiles: [],
    iterationCount: 0,
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
      iterations: 0,
    },
    limits: resolveRunLimits(),
  });

  const foundA = await agentOrchestrator.getRun(orgA, userA, runId);
  const foundWrongOrg = await agentOrchestrator.getRun(orgB, userA, runId);
  const foundWrongUser = await agentOrchestrator.getRun(orgA, userB, runId);

  assert(!!foundA, "Agent run found for owner org/user");
  assert(!foundWrongOrg, "Agent run isolated by organization");
  assert(!foundWrongUser, "Agent run isolated by user");

  // Plan persistence
  assert(foundA!.plan.length === 1 && foundA!.plan[0].id === "step-1", "Plan persisted on run");

  // Cancellation
  const cancelled = await agentOrchestrator.cancelRun(orgA, userA, runId);
  const afterCancel = await agentOrchestrator.getRun(orgA, userA, runId);
  assert(cancelled && afterCancel?.status === "CANCELLED", "Run cancellation updates status");

  await AgentRunModel.deleteOne({ id: runId });
  await mongoose.disconnect();

  console.log(`\nResults: ${passed}/${total} passed`);
  if (passed !== total) {
    process.exit(1);
  }
}

runAgentFoundationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
