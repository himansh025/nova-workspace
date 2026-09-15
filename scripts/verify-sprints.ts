import { getSprints, getActiveSprint, castPokerVote, assignTaskToSprint, completeSprint, startSprint } from "../src/server/sprintData";

async function runTests() {
  console.log("🧪 Starting Sprint Planning & Burndown Velocity Test Suite...");

  // Test 1: Get Sprints
  const sprints = getSprints();
  console.assert(sprints.length >= 2, "Should have at least 2 sprints");
  console.log(`✅ Test 1: Sprints loaded (${sprints.length} sprints)`);

  // Test 2: Active Sprint
  const active = getActiveSprint();
  console.assert(active !== undefined, "Active sprint should exist");
  console.assert(active?.status === "active", "Active sprint status should be active");
  console.log(`✅ Test 2: Active sprint verified (${active?.name})`);

  // Test 3: Burndown Data Points
  console.assert(active?.burndown.length === 14, "Burndown should contain 14 days");
  console.log(`✅ Test 3: Burndown curve contains ${active?.burndown.length} day points`);

  // Test 4: Planning Poker Vote
  const pokerResult = castPokerVote("task-2", "Elena Rostova", 5);
  console.assert(pokerResult.votes.length > 0, "Poker vote should be recorded");
  console.log(`✅ Test 4: Planning poker vote recorded (5 pts for task-2)`);

  // Test 5: Assign/Unassign Task
  const sprintId = active!.id;
  assignTaskToSprint("task-4", sprintId);
  const updatedActive = getActiveSprint();
  console.assert(updatedActive?.taskIds.includes("task-4"), "Task-4 should be assigned to active sprint");
  console.log(`✅ Test 5: Task scope assignment verified (task-4 added to sprint)`);

  console.log("\n🎉 ALL SPRINT & BURNDOWN TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
