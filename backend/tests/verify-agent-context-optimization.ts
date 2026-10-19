import { agentContextCache } from "../services/ai/agent/agentContextCache";
import {
  clearRunDedupState,
  shouldSkipToolResult,
} from "../services/ai/agent/agentContextDeduplication";
import { compressToolResult } from "../services/ai/agent/agentToolResultCompressor";
import { rankRelevantFiles, extractTaskKeywords } from "../services/ai/agent/agentRelevanceService";
import {
  classifyTaskComplexity,
  resolveModelForTask,
} from "../services/ai/agent/agentModelRouting";
import { checkRunLimits, resolveRunLimits } from "../services/ai/agent/agentRunLimits";
import {
  buildCompactAgentContext,
  serializeCompactAgentContext,
} from "../services/ai/agent/agentContextCompaction";
import {
  assertWithinBudget,
  emptyLedger,
  recordTokenUsage,
} from "../services/ai/agent/agentTokenBudget";
import { AGENT_CONFIG } from "../services/ai/agent/agentConfig";
import { formatSymbolIndexForPrompt } from "../services/ai/agent/agentSymbolIndex";

async function runContextOptimizationTests() {
  console.log("🧠 =========================================================");
  console.log("   NOVA AGENT CONTEXT & TOKEN OPTIMIZATION (PHASE 9)");
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

  agentContextCache.clearAll();
  agentContextCache.setRepositoryMetadata("org-1", "repo-1", "META_BLOCK");
  assert(
    agentContextCache.getRepositoryMetadata("org-1", "repo-1") === "META_BLOCK",
    "Repository metadata cache hit"
  );

  const tree = ["src/a.ts", "src/b.ts"];
  agentContextCache.setFileTree("org-1", "repo-1", "main", tree);
  assert(
    JSON.stringify(agentContextCache.getFileTree("org-1", "repo-1", "main")) ===
      JSON.stringify(tree),
    "File tree cache hit"
  );

  const sym = { "src/a.ts": ["function foo"] };
  agentContextCache.setSymbolIndex("org-1", "repo-1", "main", sym);
  assert(
    agentContextCache.getSymbolIndex("org-1", "repo-1", "main")?.["src/a.ts"]?.[0] === "function foo",
    "Symbol index cache hit"
  );

  const keywords = extractTaskKeywords("Fix authentication middleware in backend");
  assert(keywords.includes("authentication") || keywords.includes("middleware"), "Task keywords extracted");

  const ranked = rankRelevantFiles({
    task: "fix authentication handler",
    discovered: ["src/utils.ts", "src/auth/handler.ts", "README.md"],
    planFiles: [],
    modified: [],
    limit: 2,
  });
  assert(ranked[0]?.includes("auth"), "Relevant-file ranking prefers auth paths", ranked.join(","));

  clearRunDedupState("dedup-run");
  const skip1 = shouldSkipToolResult("dedup-run", "read_file", { path: "x.ts" });
  const skip2 = shouldSkipToolResult("dedup-run", "read_file", { path: "x.ts" });
  assert(!skip1 && skip2, "Tool-result deduplication skips repeat inputs");

  const compressed = compressToolResult("get_workspace_diff", {
    summary: { linesAdded: 1, linesRemoved: 0 },
    diffPreview: "+line\n".repeat(200),
  }) as { compressed?: boolean; diffPreview?: string };
  assert(compressed.compressed === true, "Diff-first compression for workspace diff");
  assert(
    (compressed.diffPreview?.length || 0) <= AGENT_CONFIG.toolDiffPreviewChars + 50,
    "Diff preview bounded"
  );

  const readCompressed = compressToolResult("read_file", {
    path: "a.ts",
    content: "x".repeat(10_000),
    startLine: 1,
    endLine: 100,
  }) as { truncated?: boolean; contentPreview?: string };
  assert(readCompressed.truncated === true, "read_file tool result truncated");
  assert(
    (readCompressed.contentPreview?.length || 0) <= AGENT_CONFIG.toolFilePreviewChars,
    "read_file preview within limit"
  );

  const block = formatSymbolIndexForPrompt({ "src/a.ts": ["main"] });
  assert(block.includes("src/a.ts"), "Symbol index block formatted");

  const simpleModel = resolveModelForTask({
    task: "planning",
    complexity: "simple",
    userModel: "user-model",
    orgDefault: "org-model",
  });
  const complexModel = resolveModelForTask({
    task: "planning",
    complexity: "complex",
    userModel: "user-model",
    orgDefault: "org-model",
  });
  assert(simpleModel === AGENT_CONFIG.modelFast, "Simple task routes to fast model", simpleModel);
  assert(complexModel === AGENT_CONFIG.modelStrong, "Complex task routes to strong model", complexModel);
  assert(classifyTaskComplexity("fix typo in readme") === "simple", "Classify simple task");
  assert(classifyTaskComplexity("refactor auth across services") === "complex", "Classify complex task");

  const limits = resolveRunLimits({ maxIterations: 2 });
  const hit = checkRunLimits({
    limits,
    tokenUsage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      toolCalls: 0,
      iterations: 0,
    },
    iterationCount: 2,
    startedAtMs: Date.now() - 1000,
  });
  assert(hit.exceeded && hit.kind === "maxIterations", "Run limit maxIterations");

  const compact = buildCompactAgentContext(
    {
      task: "Fix auth",
      plan: [{ id: "s1", description: "Read handler", status: "IN_PROGRESS", relevantFiles: [] }],
      currentStep: "s1",
      relevantFiles: ["src/auth.ts"],
      modifiedFiles: [],
      verificationStatus: "not_run",
      loopPhase: "READ",
    } as any,
    "[read_file] preview"
  );
  const serialized = serializeCompactAgentContext(compact);
  assert(serialized.includes("Fix auth") && serialized.includes("recentToolResults"), "Compact context shape");

  let ledger = emptyLedger();
  ledger = recordTokenUsage(ledger, "planning", 100);
  assert(ledger.planning === 100 && ledger.total === 100, "Token ledger records phase usage");

  let budgetThrew = false;
  try {
    assertWithinBudget(
      {
        planning: AGENT_CONFIG.tokenBudgetPlanning + 1,
        decision: 0,
        tools: 0,
        final: 0,
        total: AGENT_CONFIG.tokenBudgetPlanning + 1,
      },
      "planning"
    );
  } catch {
    budgetThrew = true;
  }
  assert(budgetThrew, "Token budget assert throws when phase exceeded");

  assert(AGENT_CONFIG.tokenBudgetTotal > 0, "Total token budget configured");
  assert(AGENT_CONFIG.contextCacheTtlMs > 0, "Context cache TTL configured");
  assert(AGENT_CONFIG.compressedToolMaxChars > 0, "Compressed tool digest limit configured");

  console.log(`\nResults: ${passed}/${total} passed`);
  process.exit(passed === total ? 0 : 1);
}

runContextOptimizationTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
