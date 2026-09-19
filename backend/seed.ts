import { connectMongoDB } from "./config/db";
import {
  UserModel,
  SprintModel,
  ProjectModel,
  TaskModel,
  SpecModel,
  ReleaseModel,
  TeamMemberModel,
  ActivityItemModel,
} from "./models";
import { initialWorkspaceDB } from "./services/seed";
import { getSprints } from "./services/sprintData";

const DEFAULT_SEED_USERS: any[] = [];

export async function seedMongoDB(force: boolean = false) {
  try {
    await connectMongoDB();
  } catch {
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
    UserModel.deleteMany({}),
    SprintModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    TaskModel.deleteMany({}),
    SpecModel.deleteMany({}),
    ReleaseModel.deleteMany({}),
    TeamMemberModel.deleteMany({}),
    ActivityItemModel.deleteMany({}),
  ]);

  console.log("[MongoDB Seed] Inserting seed records into local MongoDB...");
  const sprints = getSprints();

  await Promise.all([
    UserModel.insertMany(DEFAULT_SEED_USERS),
    SprintModel.insertMany(sprints),
    ProjectModel.insertMany(initialWorkspaceDB.projects),
    TaskModel.insertMany(initialWorkspaceDB.tasks),
    SpecModel.insertMany(initialWorkspaceDB.specs),
    ReleaseModel.insertMany(initialWorkspaceDB.releases),
    TeamMemberModel.insertMany(initialWorkspaceDB.team),
    ActivityItemModel.insertMany(initialWorkspaceDB.activities),
  ]);

  console.log("[MongoDB Seed] Successfully populated local MongoDB with all models!");
}

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
