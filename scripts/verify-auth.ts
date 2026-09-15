import { registerUser, findUserByEmail, createSessionToken, verifySessionToken } from "../src/server/auth";

async function runAuthTests() {
  console.log("=== Testing Authentication Layer ===");

  // 1. Verify pre-seeded demo user
  const elena = findUserByEmail("elena@nova.dev");
  if (!elena) throw new Error("Pre-seeded user elena@nova.dev not found");
  console.log(`✓ Found pre-seeded user: ${elena.name} (${elena.role})`);

  // 2. Test session token creation and verification
  const token = createSessionToken(elena.id);
  const sessionUser = verifySessionToken(token);
  if (!sessionUser || sessionUser.id !== elena.id) throw new Error("Session verification failed");
  console.log(`✓ Session token verified for: ${sessionUser.name}`);

  // 3. Test new user signup
  const testEmail = `tester_${Date.now()}@acme.dev`;
  const { user: newUser, token: newToken } = registerUser({
    name: "Devon Vance",
    email: testEmail,
    password: "securepassword123",
    role: "Senior Security Specialist",
    organization: "Acme Cyber Labs",
  });
  console.log(`✓ Registered new user: ${newUser.name} (${newUser.email}) - Org: ${newUser.organization}`);

  const newSessionUser = verifySessionToken(newToken);
  if (!newSessionUser || newSessionUser.email !== testEmail.toLowerCase()) throw new Error("New user session check failed");
  console.log(`✓ New user session active and valid`);

  console.log("\n>>> ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! <<<");
}

runAuthTests().catch((err) => {
  console.error("Auth test failed:", err);
  process.exit(1);
});
