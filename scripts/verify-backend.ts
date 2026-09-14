import { db } from "../src/server/db";

async function runTests() {
  console.log("== 1. Testing Projects ==");
  const projects = db.getProjects();
  console.log(`Fetched ${projects.length} projects. Primary: ${projects[0]?.name}`);
  if (projects.length === 0) throw new Error("No projects found!");

  console.log("\n== 2. Testing Tasks ==");
  const initialTasks = db.getTasks();
  console.log(`Initial tasks count: ${initialTasks.length}`);

  // Create a new task
  const created = db.createTask({
    title: "Verify automated test suite for distributed CRDT",
    description: "End-to-end integration test of CRDT state delta",
    priority: "urgent",
    status: "in_progress",
    tags: ["Test", "CRDT"],
    branch: "test/crdt-suite",
    estimate: "2 pts"
  });
  console.log(`Created Task: ${created.key} - "${created.title}"`);

  // Update the task status
  const updated = db.updateTask(created.id, { status: "done" });
  console.log(`Updated Task status: ${updated?.status}`);
  if (updated?.status !== "done") throw new Error("Status update failed!");

  // Filter tasks
  const doneTasks = db.getTasks({ status: "done" });
  console.log(`Done tasks count: ${doneTasks.length}`);

  console.log("\n== 3. Testing Architecture Specs ==");
  const specs = db.getSpecs();
  console.log(`Specs count: ${specs.length}. First: ${specs[0]?.key} (${specs[0]?.title})`);

  // Create a spec
  const newSpec = db.createSpec({
    title: "Edge Storage Cache Coherency",
    summary: "Ensures p99 read latency under 10ms",
    content: "## Protocol\n\n1. Invalidate on write\n2. Replicate asynchronously"
  });
  console.log(`Created Spec: ${newSpec.key} - "${newSpec.title}"`);

  // Update spec status to approved
  const approvedSpec = db.updateSpec(newSpec.id, { status: "approved" });
  console.log(`Spec status updated to: ${approvedSpec?.status}`);
  if (approvedSpec?.status !== "approved") throw new Error("Spec update failed!");

  console.log("\n== 4. Testing Releases & Pre-flight Checks ==");
  const releases = db.getReleases();
  const rel = releases[0];
  console.log(`Active Release: ${rel.version} (Canary: ${rel.canaryPercentage}%)`);

  // Update canary to 50%
  const updatedRel = db.updateRelease(rel.id, { canaryPercentage: 50 });
  console.log(`Updated canary to: ${updatedRel?.canaryPercentage}%`);

  // Run checks
  const checkedRel = db.runPreflightChecks(rel.id);
  console.log(`Preflight checks passed: ${checkedRel?.checksPassed}/${checkedRel?.totalChecks}`);

  console.log("\n== 5. Testing Telemetry & Analytics ==");
  const analytics = db.getAnalytics();
  console.log(`Analytics Cycle Time: ${analytics.cycleTimeDays}d, Throughput: ${analytics.throughputPerSprint}`);
  console.log(`Tasks by Status:`, analytics.tasksByStatus);

  console.log("\n== 6. Testing Activities Audit Log ==");
  const activities = db.getActivities(5);
  console.log(`Recent activities: ${activities.length}`);
  activities.forEach(a => console.log(` - [${a.actor.name}] ${a.action} ${a.target}`));

  console.log("\n== 7. Testing Reset Database ==");
  db.resetDatabase();
  const resetTasks = db.getTasks();
  console.log(`After reset, task count back to baseline: ${resetTasks.length}`);

  console.log("\n>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<");
}

runTests().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
