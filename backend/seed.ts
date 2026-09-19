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

const DEFAULT_SEED_USERS = [
  {
    id: "usr-1",
    name: "Elena Rostova",
    email: "elena@nova.dev",
    passwordHash: "password123",
    role: "Lead Architect",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    initials: "ER",
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "usr-2",
    name: "Marcus Chen",
    email: "marcus@nova.dev",
    passwordHash: "password123",
    role: "Staff Frontend Engineer",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    initials: "MC",
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "usr-3",
    name: "Siddharth N.",
    email: "siddharth@nova.dev",
    passwordHash: "password123",
    role: "Distributed Systems Lead",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    initials: "SN",
    createdAt: "2026-08-15T10:00:00Z",
  },
];

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
