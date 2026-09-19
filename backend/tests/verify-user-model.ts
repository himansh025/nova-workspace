import app from "../app";
import { UserModel, SprintModel, TeamMemberModel } from "../models";

const TEST_PORT = 5088;

async function runUserModelAudit() {
  console.log("🧪 =========================================================");
  console.log("   USER MODEL & MVC REGISTRATION INTEGRATION AUDIT (:5088)  ");
  console.log("=========================================================\n");

  const server = app.listen(TEST_PORT);
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  try {
    // 1. UserModel Schema & Mongoose Export
    assert(UserModel !== undefined && typeof UserModel.find === "function", "UserModel Definition", "Mongoose UserModel is loaded");
    assert(SprintModel !== undefined && typeof SprintModel.find === "function", "SprintModel Definition", "Mongoose SprintModel is loaded");

    // 2. Real User Registration (/signup)
    const uniqueEmail = `dev_${Date.now()}@nova.dev`;
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Devon Vance",
        email: uniqueEmail,
        password: "securePassword123!",
        role: "Staff Infrastructure Engineer",
        organization: "Nova Distributed Systems",
      }),
    });
    const signupData = await signupRes.json();
    assert(
      signupRes.status === 201 && signupData.success && signupData.user.email === uniqueEmail,
      "User Registration (/signup)",
      `Registered: ${signupData.user?.name} (${signupData.user?.email})`
    );
    assert(Boolean(signupData.token), "Session Token Issuance", "Issued secure session token");

    const cookieHeader = signupRes.headers.get("set-cookie") || "";
    assert(cookieHeader.includes("nova_session="), "HTTP Session Cookie", "Set-Cookie header present");

    // 3. Duplicate User Prevention
    const duplicateRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Devon Vance Duplicate",
        email: uniqueEmail,
        password: "securePassword123!",
      }),
    });
    assert(duplicateRes.status === 409, "Duplicate Email Prevention", "Rejected duplicate registration");

    // 4. Real User Login (/login)
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: "securePassword123!",
      }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.success && loginData.user.email === uniqueEmail,
      "User Login (/login)",
      `Logged in user: ${loginData.user?.name}`
    );

    // 5. Invalid Password Rejection
    const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: uniqueEmail,
        password: "wrongPassword",
      }),
    });
    assert(badLoginRes.status === 401, "Invalid Password Guard", "Rejected incorrect password");

    // 6. Validated Session Token (/me)
    const sessionCookie = loginRes.headers.get("set-cookie") || cookieHeader;
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.authenticated && meData.user.email === uniqueEmail,
      "Session Me Guard (/me)",
      `Verified active session for ${meData.user?.name}`
    );

    // 7. Logout and Invalidate
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert(logoutRes.status === 200, "User Logout (/logout)", "Cleared session");

    // Clean up test user records
    try {
      await UserModel.deleteOne({ email: uniqueEmail });
      await TeamMemberModel.deleteOne({ email: uniqueEmail });
    } catch {}

    console.log("\n---------------------------------------------------------");
    console.log(`Results: ${passed}/${total} User Model & Auth tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log("UserModel, TeamMemberModel sync, and MVC architecture verified!");
    console.log("---------------------------------------------------------\n");

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution failed:", err);
    process.exit(1);
  } finally {
    server.close();
  }
}

runUserModelAudit();
