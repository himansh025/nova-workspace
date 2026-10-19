import { redactSecrets } from "../services/ai/secretRedactor";
import { geminiProvider, ALLOWED_GEMINI_MODELS } from "../services/ai/geminiProvider";

function assert(condition: boolean, title: string, message?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${title}${message ? ` -> ${message}` : ""}`);
  } else {
    console.error(`❌ [FAIL] ${title}${message ? ` -> ${message}` : ""}`);
    throw new Error(`Assertion failed: ${title}`);
  }
}

async function runGeminiUnitTests() {
  console.log("🧪 =========================================================");
  console.log("   PHASE 3: GEMINI AI PROVIDER & SECURITY UNIT TESTS       ");
  console.log("=========================================================\n");

  // ─── 1. SECRET DETECTION & AUTOMATIC REDACTION ───────────────────────────
  console.log("▶ [1. SECRET DETECTION & AUTOMATIC REDACTION]");

  // GitHub Personal Access Token
  const ghPatSample = "My token is ghp_1234567890abcdefghijklmnopqrstuvwxyz123456 in the file";
  const ghResult = redactSecrets(ghPatSample);
  assert(ghResult.hasRedactions === true, "GitHub PAT detected");
  assert(ghResult.sanitized.includes("[REDACTED_SECRET]"), "GitHub PAT replaced with [REDACTED_SECRET]");
  assert(!ghResult.sanitized.includes("ghp_123456"), "Original GitHub PAT was completely masked");

  // OpenAI API Key
  const openAiSample = "Bearer sk-proj-1234567890abcdefghijklmnopqrstuvwxyz_1234567890";
  const openAiResult = redactSecrets(openAiSample);
  assert(openAiResult.hasRedactions === true, "OpenAI API key detected");
  assert(openAiResult.sanitized.includes("[REDACTED_SECRET]"), "OpenAI key redacted");

  // Google API Key
  const geminiKeySample = "export GEMINI_KEY=AIzaSyA1234567890123456789012345678901";
  const geminiResult = redactSecrets(geminiKeySample);
  assert(geminiResult.hasRedactions === true, "Google API Key detected");
  assert(geminiResult.sanitized.includes("[REDACTED_SECRET]"), "Google API Key redacted");

  // Database Connection URI
  const dbUriSample = "mongodb+srv://admin:SuperSecretPass123!@cluster0.mongodb.net/production";
  const dbUriResult = redactSecrets(dbUriSample);
  assert(dbUriResult.hasRedactions === true, "Database URI detected");
  assert(
    dbUriResult.sanitized.includes("mongodb+srv://[REDACTED_USER]:[REDACTED_SECRET]@[REDACTED_HOST]"),
    "Database credentials stripped from URI"
  );
  assert(!dbUriResult.sanitized.includes("SuperSecretPass123!"), "Raw DB password not present");

  // RSA Private Key
  const rsaKeySample = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3F...
SomeSecretPrivateKeyContent...
-----END RSA PRIVATE KEY-----
`;
  const rsaResult = redactSecrets(rsaKeySample);
  assert(rsaResult.hasRedactions === true, "RSA Private Key detected");
  assert(rsaResult.sanitized.includes("[REDACTED_SECRET]"), "RSA Private Key replaced");
  assert(!rsaResult.sanitized.includes("SomeSecretPrivateKeyContent"), "Private key bytes removed");

  // JWT Token
  const jwtSample = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature";
  const jwtResult = redactSecrets(jwtSample);
  assert(jwtResult.hasRedactions === true, "JWT token detected");
  assert(!jwtResult.sanitized.includes("doNotLeakThisSignature"), "JWT token signature masked");

  // Non-secret content should not be altered
  const normalText = "This is a regular TypeScript function calculating sum(a, b)";
  const normalResult = redactSecrets(normalText);
  assert(normalResult.hasRedactions === false, "Normal code unchanged", "hasRedactions: false");
  assert(normalResult.sanitized === normalText, "Sanitized output strictly equals normal text");

  // ─── 2. GEMINI MODEL ALLOWLIST & RESOLUTION ──────────────────────────────
  console.log("\n▶ [2. GEMINI MODEL ALLOWLIST & RESOLUTION]");

  assert(ALLOWED_GEMINI_MODELS.length >= 4, "Allowed models list populated", `${ALLOWED_GEMINI_MODELS.length} models`);
  assert(geminiProvider.isModelSupported("gemini-2.5-flash") === true, "gemini-2.5-flash supported");
  assert(geminiProvider.isModelSupported("gemini-2.5-pro") === true, "gemini-2.5-pro supported");
  assert(geminiProvider.isModelSupported("gemini-2.0-flash") === true, "gemini-2.0-flash supported");
  assert(geminiProvider.isModelSupported("unsupported-random-model") === false, "Unknown model rejected");

  assert(
    geminiProvider.resolveModelId("gemini-2.5-pro") === "gemini-2.5-pro",
    "Resolves valid model directly"
  );
  assert(
    geminiProvider.resolveModelId("unknown-model") === "gemini-2.5-flash",
    "Falls back to default gemini-2.5-flash for unknown model"
  );
  assert(
    geminiProvider.resolveModelId(undefined) === "gemini-2.5-flash",
    "Falls back to default model for undefined model"
  );

  // ─── 3. CREDENTIAL VALIDATION EMPTY CHECK ────────────────────────────────
  console.log("\n▶ [3. CREDENTIAL VALIDATION]");

  const emptyValidation = await geminiProvider.validateCredentials("");
  assert(emptyValidation.valid === false, "Empty API key rejected", emptyValidation.error);

  const whitespaceValidation = await geminiProvider.validateCredentials("   ");
  assert(whitespaceValidation.valid === false, "Whitespace API key rejected", whitespaceValidation.error);

  console.log("\n🎉 ALL PHASE 3 GEMINI UNIT TESTS PASSED SUCCESSFULLY!\n");
}

runGeminiUnitTests().catch((err) => {
  console.error("FATAL UNIT TEST FAILURE:", err);
  process.exit(1);
});
