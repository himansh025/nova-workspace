import app from "../app";
import mongoose from "mongoose";
import { connectMongoDB } from "../config/db";
import { UserModel, TaskModel, OrganizationModel, OrganizationMemberModel, SessionModel } from "../models";
import { registerUserAccount, authenticateUser } from "../services/auth";
import { taskService } from "../services/taskService";
import { createOrganization } from "../services/organizationService";
import crypto from "crypto";

const TEST_PORT = 5098;

async function runSecurityAudit() {
  console.log("🔒 =========================================================");
  console.log("   NOVA PRODUCTION SECURITY & TENANT ISOLATION SUITE        ");
  console.log("=========================================================\n");

  try {
    await connectMongoDB();
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }

  const server = app.listen(TEST_PORT);
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`🛡️ [PASS] ${testName}${detail ? ` -> ${detail}` : ""}`);
      passed++;
    } else {
      console.error(`💥 [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    }
  }

  try {
    // ─── Test 1: Unauthenticated Access Guard ─────────────────────────────
    const unauthRes = await fetch(`${baseUrl}/api/tasks`);
    assert(
      unauthRes.status === 401,
      "Unauthenticated Access Blocked",
      "GET /api/tasks returned 401 when no session provided"
    );

    // ─── Test 2: Insecure / Forged Token Rejection ─────────────────────────
    const forgedRes = await fetch(`${baseUrl}/api/tasks`, {
      headers: { Authorization: "Bearer forged_fake_token_attacker_attempt" },
    });
    assert(
      forgedRes.status === 401,
      "Forged Token Rejected",
      "Rejected unhashed / unknown bearer token with 401"
    );

    // ─── Test 3: Demo Password Backdoor Eliminated ─────────────────────────
    const victimEmail = `victim_${Date.now()}@acme.corp`;
    const victimPass = "CorrectHorseBatteryStaple99!";
    await registerUserAccount({
      name: "Alice Acme",
      email: victimEmail,
      password: victimPass,
      organizationName: "Acme Corp",
    });

    let backdoorFailed = false;
    try {
      await authenticateUser(victimEmail, "password123");
    } catch {
      backdoorFailed = true;
    }
    assert(
      backdoorFailed,
      "Demo Backdoor Eliminated",
      "Default 'password123' fails against user with different password"
    );

    // ─── Test 4: Account Lockout after 5 Failed Attempts ───────────────────
    for (let i = 0; i < 5; i++) {
      try {
        await authenticateUser(victimEmail, "WrongPasswordAttempts");
      } catch {}
    }

    let lockoutTriggered = false;
    try {
      await authenticateUser(victimEmail, victimPass); // even correct password should be locked
    } catch (err: any) {
      if (err.message?.includes("temporarily locked")) {
        lockoutTriggered = true;
      }
    }
    assert(
      lockoutTriggered,
      "Brute-force Account Lockout",
      "Account locked after 5 consecutive failed login attempts"
    );

    // ─── Test 5: Multi-Tenant Data Isolation (Cross-Tenant Attack) ─────────
    // Create Org Alpha and Org Beta
    const userAlphaEmail = `alpha_${Date.now()}@alpha.io`;
    const userBetaEmail = `beta_${Date.now()}@beta.io`;

    const { user: userAlpha, sessionToken: tokenAlpha } = await registerUserAccount({
      name: "Alice Alpha",
      email: userAlphaEmail,
      password: "StrongAlphaPass123!",
      organizationName: "Alpha Corp",
    });

    const { user: userBeta, sessionToken: tokenBeta } = await registerUserAccount({
      name: "Bob Beta",
      email: userBetaEmail,
      password: "StrongBetaPass123!",
      organizationName: "Beta Corp",
    });

    // Create a confidential task inside Alpha Corp
    const alphaTask = await taskService.createTask({
      organizationId: userAlpha.organizationId!,
      title: "Confidential Project Titan Secret Specs",
      description: "Restricted to Alpha Corp internal staff only",
      creatorName: userAlpha.name,
      creatorInitials: userAlpha.initials,
    });

    // User Beta attempts to read Alpha Corp's tasks
    const betaQueryAlphaRes = await fetch(`${baseUrl}/api/tasks`, {
      headers: {
        Authorization: `Bearer ${tokenBeta}`,
        "X-Organization-ID": userAlpha.organizationId!, // Attacker tries spoofing org header
      },
    });
    const betaQueryResult = (await betaQueryAlphaRes.json()) as any;

    // Check that Alpha's task was NOT returned to Beta
    const leakedTask = betaQueryResult.tasks?.find((t: any) => t.id === alphaTask.id);
    assert(
      !leakedTask,
      "Cross-Tenant Read Blocked",
      "User Beta cannot view confidential task created by Alpha Corp"
    );

    // User Beta attempts to mutate Alpha Corp's task
    const betaMutateRes = await fetch(`${baseUrl}/api/tasks/${alphaTask.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenBeta}`,
      },
      body: JSON.stringify({ title: "DEFACED BY BETA ATTACKER" }),
    });
    assert(
      betaMutateRes.status === 404,
      "Cross-Tenant Mutation Blocked",
      "Mutation attempt across tenant boundary rejected (404 Task Not Found)"
    );

    // Verify task title remains unmodified in DB
    const freshAlphaTask = await TaskModel.findOne({ id: alphaTask.id });
    assert(
      freshAlphaTask?.title === "Confidential Project Titan Secret Specs",
      "Data Integrity Preserved",
      "Target task remained untampered in Alpha's tenancy"
    );

    // Clean up test records
    await Promise.all([
      UserModel.deleteMany({ email: { $in: [victimEmail, userAlphaEmail, userBetaEmail] } }),
      TaskModel.deleteMany({ id: alphaTask.id }),
      SessionModel.deleteMany({ userId: { $in: [userAlpha.id, userBeta.id] } }),
    ]);

    console.log("\n---------------------------------------------------------");
    console.log(`Results: ${passed}/${total} Security & Isolation tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log("OWASP tenant isolation, brute-force mitigation, and auth guard verified!");
    console.log("---------------------------------------------------------\n");

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Security test failed:", err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(passed === total ? 0 : 1);
  }
}

runSecurityAudit();
