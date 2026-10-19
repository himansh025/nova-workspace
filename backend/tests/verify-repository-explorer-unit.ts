import {
  normalizeAndValidatePath,
  validateBranch,
  validateSearchQuery,
  validatePagination,
  isBinaryFilename,
  isBinaryBuffer,
  detectLanguage,
  GitHubExplorerError,
} from "../services/githubRepositoryExplorerService";
import {
  detectProjectTypeFromFiles,
  detectPackageManager,
} from "../services/repositoryContextService";

function assert(condition: boolean, title: string, message?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${title}${message ? ` -> ${message}` : ""}`);
  } else {
    console.error(`❌ [FAIL] ${title}${message ? ` -> ${message}` : ""}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

function assertThrows(fn: () => any, title: string, expectedMessageSubstring?: string) {
  try {
    fn();
    console.error(`❌ [FAIL] ${title} -> Expected function to throw, but it succeeded.`);
    throw new Error(`Assertion failed: ${title}`);
  } catch (err: any) {
    if (expectedMessageSubstring && !err.message.includes(expectedMessageSubstring)) {
      console.error(`❌ [FAIL] ${title} -> Expected message containing "${expectedMessageSubstring}", got "${err.message}"`);
      throw err;
    }
    console.log(`✅ [PASS] ${title} -> Threw expected error: ${err.message}`);
  }
}

async function runUnitTests() {
  console.log("🧪 =========================================================");
  console.log("   PHASE 2: REPOSITORY EXPLORER UNIT TEST SUITE            ");
  console.log("=========================================================\n");

  // ─── 1. PATH SANITIZATION & TRAVERSAL ATTACK PREVENTION ──────────────────
  console.log("▶ [1. PATH SANITIZATION & TRAVERSAL PREVENTION]");

  assert(normalizeAndValidatePath("") === "", "Empty path", "Normalized to empty string (root)");
  assert(normalizeAndValidatePath(undefined) === "", "Undefined path", "Normalized to empty string (root)");
  assert(normalizeAndValidatePath("src/components/Button.tsx") === "src/components/Button.tsx", "Standard path", "src/components/Button.tsx");
  assert(normalizeAndValidatePath("/src/components/") === "src/components", "Leading and trailing slashes stripped", "src/components");

  assertThrows(() => normalizeAndValidatePath("../secret.env"), "Path traversal with ../", "Path traversal sequence detected");
  assertThrows(() => normalizeAndValidatePath("src/../../etc/passwd"), "Deep path traversal", "Path traversal sequence detected");
  assertThrows(() => normalizeAndValidatePath("src\\components"), "Windows backslash in path", "Path traversal sequence detected");
  assertThrows(() => normalizeAndValidatePath("src/%2e%2e/secret"), "URL-encoded traversal %2e%2e", "Path traversal sequence detected");
  assertThrows(() => normalizeAndValidatePath("src/file\0.ts"), "Null byte in path", "illegal control characters");
  assertThrows(() => normalizeAndValidatePath("a/".repeat(300)), "Oversized path length", "Path exceeds maximum permitted length");

  // ─── 2. BRANCH & QUERY VALIDATION ─────────────────────────────────────────
  console.log("\n▶ [2. BRANCH & QUERY VALIDATION]");

  assert(validateBranch("feature/user-auth") === "feature/user-auth", "Valid branch name", "feature/user-auth");
  assert(validateBranch("", "main") === "main", "Empty branch fallback to default", "main");
  assertThrows(() => validateBranch("branch with spaces"), "Branch with spaces", "Invalid or unsafe branch name");
  assertThrows(() => validateBranch("-invalid-branch"), "Branch starting with dash", "Invalid or unsafe branch name");
  assertThrows(() => validateBranch("branch..name"), "Branch with double dot", "Invalid or unsafe branch name");

  assert(validateSearchQuery("NotificationCenter") === "NotificationCenter", "Valid search query", "NotificationCenter");
  assertThrows(() => validateSearchQuery(""), "Empty search query", "Search query 'q' parameter is required");
  assertThrows(() => validateSearchQuery("a".repeat(250)), "Oversized search query", "Search query exceeds maximum length");

  // ─── 3. PAGINATION SANITIZATION ──────────────────────────────────────────
  console.log("\n▶ [3. PAGINATION SANITIZATION]");

  const p1 = validatePagination(undefined, undefined);
  assert(p1.page === 1 && p1.perPage === 30, "Default pagination", `Page: ${p1.page}, perPage: ${p1.perPage}`);

  const p2 = validatePagination("3", "50");
  assert(p2.page === 3 && p2.perPage === 50, "Parsed string pagination", `Page: ${p2.page}, perPage: ${p2.perPage}`);

  const p3 = validatePagination("-5", "1000", 100);
  assert(p3.page === 1 && p3.perPage === 100, "Bounded pagination extremes", `Page: ${p3.page}, perPage: ${p3.perPage}`);

  // ─── 4. BINARY DETECTION ──────────────────────────────────────────────────
  console.log("\n▶ [4. BINARY FILE DETECTION]");

  assert(isBinaryFilename("image.png"), "Binary image (.png)", "Identified as binary");
  assert(isBinaryFilename("bundle.wasm"), "Binary WebAssembly (.wasm)", "Identified as binary");
  assert(isBinaryFilename("archive.tar.gz"), "Binary archive (.tar.gz)", "Identified as binary");
  assert(isBinaryFilename("document.pdf"), "Binary PDF (.pdf)", "Identified as binary");
  assert(!isBinaryFilename("index.ts"), "Source file (.ts)", "Not binary");
  assert(!isBinaryFilename("README.md"), "Markdown doc (.md)", "Not binary");
  assert(!isBinaryFilename("package.json"), "JSON file (.json)", "Not binary");

  // Buffer binary check
  const textBuffer = Buffer.from("function hello() { return 'world'; }\n", "utf8");
  assert(!isBinaryBuffer(textBuffer), "Text UTF-8 buffer", "Identified as text");

  const binaryBufferWithNulls = Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00, 0x01, 0x01, 0x00]); // ELF header with null byte
  assert(isBinaryBuffer(binaryBufferWithNulls), "ELF binary buffer with null byte", "Identified as binary");

  // ─── 5. LANGUAGE DETECTION ────────────────────────────────────────────────
  console.log("\n▶ [5. LANGUAGE DETECTION]");

  assert(detectLanguage("App.tsx") === "typescript", "TypeScript detection (.tsx)", "typescript");
  assert(detectLanguage("server.py") === "python", "Python detection (.py)", "python");
  assert(detectLanguage("main.go") === "go", "Go detection (.go)", "go");
  assert(detectLanguage("lib.rs") === "rust", "Rust detection (.rs)", "rust");
  assert(detectLanguage("Dockerfile") === "dockerfile", "Dockerfile detection", "dockerfile");
  assert(detectLanguage("Cargo.toml") === "toml", "Cargo.toml detection", "toml");

  // ─── 6. PROJECT TYPE DETECTION (DETERMINISTIC) ─────────────────────────────
  console.log("\n▶ [6. PROJECT TYPE DETECTION]");

  const nextFiles = ["next.config.ts", "package.json", "src/app/page.tsx", "tsconfig.json"];
  const nextDet = detectProjectTypeFromFiles(nextFiles);
  assert(nextDet.projectType === "Next.js" && nextDet.confidence === 1.0, "Next.js detection", `Confidence: ${nextDet.confidence}, Evidence: ${nextDet.evidence.join(", ")}`);

  const viteFiles = ["vite.config.ts", "package.json", "src/main.tsx", "index.html"];
  const viteDet = detectProjectTypeFromFiles(viteFiles);
  assert(viteDet.projectType === "Vite" && viteDet.confidence === 1.0, "Vite detection", `Confidence: ${viteDet.confidence}`);

  const rustFiles = ["Cargo.toml", "Cargo.lock", "src/main.rs"];
  const rustDet = detectProjectTypeFromFiles(rustFiles);
  assert(rustDet.projectType === "Rust" && rustDet.confidence === 1.0, "Rust detection", `Confidence: ${rustDet.confidence}`);

  const goFiles = ["go.mod", "go.sum", "main.go"];
  const goDet = detectProjectTypeFromFiles(goFiles);
  assert(goDet.projectType === "Go" && goDet.confidence === 1.0, "Go detection", `Confidence: ${goDet.confidence}`);

  const pythonFiles = ["pyproject.toml", "requirements.txt", "app.py"];
  const pyDet = detectProjectTypeFromFiles(pythonFiles);
  assert(pyDet.projectType === "Python" && pyDet.confidence === 0.95, "Python detection", `Confidence: ${pyDet.confidence}`);

  const mavenFiles = ["pom.xml", "src/main/java/App.java"];
  const mavenDet = detectProjectTypeFromFiles(mavenFiles);
  assert(mavenDet.projectType === "Java (Maven)" && mavenDet.confidence === 1.0, "Maven detection", `Confidence: ${mavenDet.confidence}`);

  // ─── 7. PACKAGE MANAGER DETECTION ─────────────────────────────────────────
  console.log("\n▶ [7. PACKAGE MANAGER DETECTION]");

  assert(detectPackageManager(["pnpm-lock.yaml", "package.json"]).name === "pnpm", "pnpm lockfile detection", "pnpm");
  assert(detectPackageManager(["yarn.lock", "package.json"]).name === "yarn", "yarn lockfile detection", "yarn");
  assert(detectPackageManager(["package-lock.json", "package.json"]).name === "npm", "npm lockfile detection", "npm");
  assert(detectPackageManager(["bun.lockb", "package.json"]).name === "bun", "bun lockfile detection", "bun");
  assert(detectPackageManager(["Cargo.lock", "Cargo.toml"]).name === "cargo", "cargo lockfile detection", "cargo");
  assert(detectPackageManager(["poetry.lock", "pyproject.toml"]).name === "poetry", "poetry lockfile detection", "poetry");

  // ─── 8. ERROR CLASS & STATUS CODE MAPPINGS ────────────────────────────────
  console.log("\n▶ [8. ERROR STRUCTURE & CODE MAPPINGS]");

  const explorerErr = new GitHubExplorerError("Rate limit reached", 429, "RATE_LIMIT_EXCEEDED");
  assert(explorerErr.statusCode === 429 && explorerErr.code === "RATE_LIMIT_EXCEEDED", "Custom Explorer Error", `${explorerErr.statusCode} - ${explorerErr.code}`);

  console.log("\n=========================================================");
  console.log("Results: ALL Repository Explorer Unit Tests Passed! (100%)");
  console.log("=========================================================\n");
}

runUnitTests().catch((err) => {
  console.error("Unit test failure:", err);
  process.exit(1);
});
