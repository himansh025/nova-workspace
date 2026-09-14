import { connectMongoDB } from "./db";
import {
  ProjectModel,
  TaskModel,
  SpecModel,
  ReleaseModel,
  TeamMemberModel,
  ActivityItemModel,
} from "./models";
import { initialWorkspaceDB } from "../server/seed";

export async function seedMongoDB(force: boolean = false) {
  try {
    await connectMongoDB();
  } catch (err) {
    console.warn("[MongoDB Seed] Connection unavailable, skipping MongoDB seeding.");
    return;
  }

  if (!force) {
    const taskCount = await TaskModel.countDocuments();
    if (taskCount > 0) {
      console.log(`[MongoDB Seed] Database already populated with ${taskCount} tasks. Skipping auto-seed.`);
      return;
    }
  }

  console.log("[MongoDB Seed] Wiping existing collections...");
  await Promise.all([
    ProjectModel.deleteMany({}),
    TaskModel.deleteMany({}),
    SpecModel.deleteMany({}),
    ReleaseModel.deleteMany({}),
    TeamMemberModel.deleteMany({}),
    ActivityItemModel.deleteMany({}),
  ]);

  console.log("[MongoDB Seed] Inserting seed records into local MongoDB...");
  await Promise.all([
    ProjectModel.insertMany(initialWorkspaceDB.projects),
    TaskModel.insertMany(initialWorkspaceDB.tasks),
    SpecModel.insertMany(initialWorkspaceDB.specs),
    ReleaseModel.insertMany(initialWorkspaceDB.releases),
    TeamMemberModel.insertMany(initialWorkspaceDB.team),
    ActivityItemModel.insertMany(initialWorkspaceDB.activities),
  ]);

  console.log("[MongoDB Seed] Successfully populated local MongoDB!");
}

// Standalone execution support
if (require.main === module) {
  seedMongoDB(true)
    .then(() => {
      console.log("Seeding complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
