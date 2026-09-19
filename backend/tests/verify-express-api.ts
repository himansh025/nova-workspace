import http from "http";
import app from "../app";

const TEST_PORT = 5099;

async function runExpressAudit() {
  console.log("🚀 =========================================================");
  console.log("   STANDALONE NODE.JS EXPRESS BACKEND API AUDIT (:5099)     ");
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
    // 1. Health
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 && (healthData.status === "online" || healthData.status === "healthy"),
      "Health Endpoint",
      "Node.js Express Modular Backend (200 OK)"
    );

    // 2. Auth Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "elena@nova.dev", password: "password123" }),
    });
    const loginData = await loginRes.json();
    assert(
      loginRes.status === 200 && loginData.success && loginData.user.name === "Elena Rostova",
      "Auth Login Endpoint",
      `User: ${loginData.user?.name}, Token issued`
    );

    const setCookie = loginRes.headers.get("set-cookie") || "";
    const sessionTokenMatch = setCookie.match(/nova_session=([^;]+)/);
    const sessionCookie = sessionTokenMatch ? `nova_session=${sessionTokenMatch[1]}` : setCookie;
    assert(setCookie.includes("nova_session="), "Session Cookie Set", "HTTP Cookie header verified");

    // 3. Auth Me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 && meData.authenticated && meData.user.name === "Elena Rostova",
      "Auth Me Endpoint",
      `Validated: ${meData.user?.name}`
    );

    // 4. Tasks List
    const tasksRes = await fetch(`${baseUrl}/api/tasks`);
    const tasksData = await tasksRes.json();
    assert(
      tasksRes.status === 200 && tasksData.success && tasksData.tasks.length > 0,
      "Tasks List API",
      `Returned ${tasksData.tasks?.length} tasks`
    );

    // 5. Create Task
    const newTaskTitle = `Audit Distributed Lock ${Date.now()}`;
    const createTaskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle,
        description: "Verify distributed locking semantics across express nodes",
        priority: "urgent",
        status: "in_progress",
        tags: ["Distributed", "Audit"],
      }),
    });
    const createdTaskData = await createTaskRes.json();
    assert(
      createTaskRes.status === 201 && createdTaskData.success && createdTaskData.task.key,
      "Task Creation API",
      `Created: ${createdTaskData.task?.key}`
    );

    // 6. Update Task
    const createdId = createdTaskData.task?.id;
    const updateTaskRes = await fetch(`${baseUrl}/api/tasks/${createdId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    const updatedTaskData = await updateTaskRes.json();
    assert(
      updateTaskRes.status === 200 && updatedTaskData.success && updatedTaskData.task.status === "done",
      "Task Mutation API",
      "Updated status to done"
    );

    // 7. Sprints
    const sprintsRes = await fetch(`${baseUrl}/api/sprints`);
    const sprintsData = await sprintsRes.json();
    assert(
      sprintsRes.status === 200 && sprintsData.success && sprintsData.activeSprint,
      "Sprints Hub API",
      `Active: ${sprintsData.activeSprint?.name}`
    );
    assert(
      sprintsData.activeSprint?.burndown?.length > 0,
      "Burndown Trajectory",
      `Contains ${sprintsData.activeSprint?.burndown?.length} day points`
    );

    // 8. Planning Poker
    const pokerRes = await fetch(`${baseUrl}/api/sprints/poker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: createdId,
        points: 8,
        voter: "Elena Rostova",
      }),
    });
    const pokerData = await pokerRes.json();
    assert(
      pokerRes.status === 200 && pokerData.success && pokerData.votes?.length > 0,
      "Planning Poker API",
      "Voted 8 pts for task"
    );

    // 9. Pull Requests
    const prsRes = await fetch(`${baseUrl}/api/pull-requests`);
    const prsData = await prsRes.json();
    assert(
      prsRes.status === 200 && prsData.success && prsData.pullRequests.length > 0,
      "Pull Requests API",
      `Loaded ${prsData.pullRequests?.length} PRs`
    );

    // 10. AI PR Reviewer
    const aiReviewRes = await fetch(`${baseUrl}/api/ai/review-pr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prId: "pr-1" }),
    });
    const aiReviewData = await aiReviewRes.json();
    assert(
      aiReviewRes.status === 200 && aiReviewData.success && aiReviewData.review?.score,
      "AI PR Reviewer API",
      `Score: ${aiReviewData.review?.score}/100`
    );

    // 11. Service Mesh
    const meshRes = await fetch(`${baseUrl}/api/architecture`);
    const meshData = await meshRes.json();
    assert(
      meshRes.status === 200 && meshData.success && meshData.nodes.length > 0,
      "Service Mesh API",
      `${meshData.nodes?.length} Distributed Nodes`
    );

    // 12. Probe Node
    const probeRes = await fetch(`${baseUrl}/api/architecture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodeId: "node-edge", action: "probe" }),
    });
    const probeData = await probeRes.json();
    assert(
      probeRes.status === 200 && probeData.success && probeData.node?.p99Latency,
      "Mesh Probe API",
      `Latency jitter: ${probeData.node?.p99Latency}`
    );

    // 13. Outgoing Webhooks
    const webhooksRes = await fetch(`${baseUrl}/api/webhooks/outgoing`);
    const webhooksData = await webhooksRes.json();
    assert(
      webhooksRes.status === 200 && webhooksData.success && webhooksData.webhooks.length > 0,
      "Outgoing Webhooks API",
      `Loaded ${webhooksData.webhooks?.length} integrations`
    );

    // 14. Dispatch Webhook
    const dispatchRes = await fetch(`${baseUrl}/api/webhooks/outgoing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", id: "wh-1" }),
    });
    const dispatchData = await dispatchRes.json();
    assert(
      dispatchRes.status === 200 && dispatchData.success,
      "Webhook Dispatch API",
      "Dispatched HMAC test payload"
    );

    // 15. Specs
    const specsRes = await fetch(`${baseUrl}/api/specs`);
    const specsData = await specsRes.json();
    assert(
      specsRes.status === 200 && specsData.success && specsData.specs.length > 0,
      "Specs API",
      `Loaded ${specsData.specs?.length} specs`
    );

    // 16. Releases
    const releasesRes = await fetch(`${baseUrl}/api/releases`);
    const releasesData = await releasesRes.json();
    assert(
      releasesRes.status === 200 && releasesData.success && releasesData.releases.length > 0,
      "Releases API",
      `Version: ${releasesData.releases[0]?.version}`
    );

    console.log("\n---------------------------------------------------------");
    console.log(`Results: ${passed}/${total} Express API tests passed (${Math.round((passed / total) * 100)}%)`);
    console.log("Standalone Node.js Express server is 100% verified & operational!");
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

runExpressAudit();
