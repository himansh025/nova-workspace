import fs from "fs";
import path from "path";
import { db as workspaceDB } from "./db";
import { broadcastEvent } from "./events";

export interface SprintDayBurndown {
  day: number;
  date: string;
  idealRemaining: number;
  actualRemaining: number | null; // null for future days
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  status: "active" | "planned" | "completed";
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  taskIds: string[];
  burndown: SprintDayBurndown[];
}

export interface VelocityHistory {
  sprintId: string;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
  completionRate: number;
}

export interface PokerVote {
  taskId: string;
  voter: string;
  points: number;
  timestamp: string;
}

export interface SprintsDB {
  sprints: Sprint[];
  velocityHistory: VelocityHistory[];
  pokerVotes: Record<string, PokerVote[]>; // taskId -> votes
}

const DATA_DIR = path.join(process.cwd(), ".data");
const SPRINTS_FILE = path.join(DATA_DIR, "nova-sprints.json");

const INITIAL_SPRINTS_DATA: SprintsDB = {
  sprints: [
    {
      id: "sprint-24",
      name: "Sprint 24: Distributed CRDT & Canary Mesh",
      goal: "Stabilize CRDT state delta compaction, zero-copy binary parser, and deploy canary traffic to 25%.",
      status: "active",
      startDate: "2026-09-08",
      endDate: "2026-09-22",
      totalDays: 14,
      currentDay: 8,
      totalPoints: 42,
      completedPoints: 26,
      remainingPoints: 16,
      taskIds: [
        "task-1", // NV-842
        "task-2", // NV-847
        "task-3", // NV-851
        "task-7", // NV-865
        "task-9", // NV-870
        "task-10" // NV-873
      ],
      burndown: [
        { day: 1, date: "Sep 08", idealRemaining: 42, actualRemaining: 42 },
        { day: 2, date: "Sep 09", idealRemaining: 39, actualRemaining: 42 },
        { day: 3, date: "Sep 10", idealRemaining: 36, actualRemaining: 37 },
        { day: 4, date: "Sep 11", idealRemaining: 33, actualRemaining: 34 },
        { day: 5, date: "Sep 12", idealRemaining: 30, actualRemaining: 29 },
        { day: 6, date: "Sep 13", idealRemaining: 27, actualRemaining: 26 },
        { day: 7, date: "Sep 14", idealRemaining: 24, actualRemaining: 26 },
        { day: 8, date: "Sep 15", idealRemaining: 21, actualRemaining: 16 },
        { day: 9, date: "Sep 16", idealRemaining: 18, actualRemaining: null },
        { day: 10, date: "Sep 17", idealRemaining: 15, actualRemaining: null },
        { day: 11, date: "Sep 18", idealRemaining: 12, actualRemaining: null },
        { day: 12, date: "Sep 19", idealRemaining: 9, actualRemaining: null },
        { day: 13, date: "Sep 20", idealRemaining: 6, actualRemaining: null },
        { day: 14, date: "Sep 21", idealRemaining: 0, actualRemaining: null }
      ]
    },
    {
      id: "sprint-25",
      name: "Sprint 25: Multi-region Sharding & Auth Guard",
      goal: "Implement cross-region data replication, session revocation cascade, and edge audit log aggregation.",
      status: "planned",
      startDate: "2026-09-23",
      endDate: "2026-10-07",
      totalDays: 14,
      currentDay: 0,
      totalPoints: 34,
      completedPoints: 0,
      remainingPoints: 34,
      taskIds: [
        "task-4", // NV-859
        "task-5", // NV-860
        "task-6", // NV-862
        "task-8"  // NV-868
      ],
      burndown: [
        { day: 1, date: "Sep 23", idealRemaining: 34, actualRemaining: 34 },
        { day: 14, date: "Oct 07", idealRemaining: 0, actualRemaining: null }
      ]
    },
    {
      id: "sprint-23",
      name: "Sprint 23: Outgoing Webhooks & Schema Validation",
      goal: "Finalized HMAC signature verification, dead-letter retry queue, and JSON schema preflight checks.",
      status: "completed",
      startDate: "2026-08-25",
      endDate: "2026-09-07",
      totalDays: 14,
      currentDay: 14,
      totalPoints: 38,
      completedPoints: 38,
      remainingPoints: 0,
      taskIds: [],
      burndown: []
    }
  ],
  velocityHistory: [
    {
      sprintId: "sprint-21",
      sprintName: "Sprint 21",
      committedPoints: 35,
      completedPoints: 33,
      completionRate: 94.2
    },
    {
      sprintId: "sprint-22",
      sprintName: "Sprint 22",
      committedPoints: 40,
      completedPoints: 38,
      completionRate: 95.0
    },
    {
      sprintId: "sprint-23",
      sprintName: "Sprint 23",
      committedPoints: 38,
      completedPoints: 38,
      completionRate: 100
    }
  ],
  pokerVotes: {
    "task-1": [
      { taskId: "task-1", voter: "Elena Rostova", points: 8, timestamp: "2026-09-08T10:00:00Z" },
      { taskId: "task-1", voter: "Marcus Chen", points: 8, timestamp: "2026-09-08T10:01:00Z" },
      { taskId: "task-1", voter: "Siddharth N.", points: 5, timestamp: "2026-09-08T10:02:00Z" }
    ],
    "task-7": [
      { taskId: "task-7", voter: "Elena Rostova", points: 13, timestamp: "2026-09-08T10:05:00Z" },
      { taskId: "task-7", voter: "Siddharth N.", points: 13, timestamp: "2026-09-08T10:06:00Z" }
    ]
  }
};

let sprintCache: SprintsDB | null = null;

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSprintsDB(): SprintsDB {
  if (sprintCache) return sprintCache;
  ensureDir();

  if (!fs.existsSync(SPRINTS_FILE)) {
    saveSprintsDB(INITIAL_SPRINTS_DATA);
    sprintCache = JSON.parse(JSON.stringify(INITIAL_SPRINTS_DATA));
    return sprintCache!;
  }

  try {
    const raw = fs.readFileSync(SPRINTS_FILE, "utf-8");
    sprintCache = JSON.parse(raw) as SprintsDB;
    return sprintCache;
  } catch {
    sprintCache = JSON.parse(JSON.stringify(INITIAL_SPRINTS_DATA));
    return sprintCache!;
  }
}

function saveSprintsDB(data: SprintsDB): void {
  ensureDir();
  const tmp = `${SPRINTS_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmp, SPRINTS_FILE);
    sprintCache = data;
  } catch (err) {
    console.error("Failed to save sprints DB:", err);
    sprintCache = data;
  }
}

export function getSprints(): Sprint[] {
  const db = loadSprintsDB();
  return db.sprints;
}

export function getActiveSprint(): Sprint | undefined {
  const db = loadSprintsDB();
  return db.sprints.find((s) => s.status === "active") || db.sprints[0];
}

export function getSprintById(id: string): Sprint | undefined {
  const db = loadSprintsDB();
  return db.sprints.find((s) => s.id === id);
}

export function getVelocityHistory(): VelocityHistory[] {
  const db = loadSprintsDB();
  return db.velocityHistory;
}

export function getPokerVotes(taskId: string): PokerVote[] {
  const db = loadSprintsDB();
  return db.pokerVotes[taskId] || [];
}

export function castPokerVote(taskId: string, voter: string, points: number): { votes: PokerVote[]; consensus: number | null } {
  const db = loadSprintsDB();
  if (!db.pokerVotes[taskId]) {
    db.pokerVotes[taskId] = [];
  }

  // Remove previous vote by this voter if any
  db.pokerVotes[taskId] = db.pokerVotes[taskId].filter((v) => v.voter !== voter);
  db.pokerVotes[taskId].push({
    taskId,
    voter,
    points,
    timestamp: new Date().toISOString()
  });

  // Check consensus
  const votes = db.pokerVotes[taskId];
  const allSame = votes.length > 1 && votes.every((v) => v.points === votes[0].points);
  const consensus = allSame ? votes[0].points : null;

  // Also update task estimate if single vote or consensus
  workspaceDB.updateTask(taskId, { estimate: `${points} pts` });

  // Recalculate sprint points if task is in active sprint
  recalculateSprintPoints();

  saveSprintsDB(db);

  broadcastEvent({
    type: "task_updated",
    category: "tasks",
    title: "Planning Poker Estimate Updated",
    message: `${voter} voted ${points} pts for task`,
    link: "/app/sprints",
    meta: { taskId, points }
  });

  return { votes, consensus };
}

export function assignTaskToSprint(taskId: string, targetSprintId: string | null): Sprint | undefined {
  const db = loadSprintsDB();

  // Remove from all sprints first
  db.sprints.forEach((s) => {
    s.taskIds = s.taskIds.filter((id) => id !== taskId);
  });

  if (targetSprintId) {
    const target = db.sprints.find((s) => s.id === targetSprintId);
    if (target && !target.taskIds.includes(taskId)) {
      target.taskIds.push(taskId);
    }
  }

  recalculateSprintPoints();
  saveSprintsDB(db);

  broadcastEvent({
    type: "task_updated",
    category: "tasks",
    title: "Sprint Scope Modified",
    message: targetSprintId ? `Task moved to ${targetSprintId}` : "Task moved to Backlog",
    link: "/app/sprints"
  });

  return getActiveSprint();
}

export function completeSprint(sprintId: string, rolloverTargetId?: string): { completedSprint: Sprint; rolledOverCount: number } {
  const db = loadSprintsDB();
  const sprintIndex = db.sprints.findIndex((s) => s.id === sprintId);
  if (sprintIndex === -1) throw new Error("Sprint not found");

  const sprint = db.sprints[sprintIndex];
  sprint.status = "completed";

  const allTasks = workspaceDB.getTasks();
  const sprintTasks = allTasks.filter((t) => sprint.taskIds.includes(t.id));
  const doneTasks = sprintTasks.filter((t) => t.status === "done");
  const incompleteTasks = sprintTasks.filter((t) => t.status !== "done");

  const completedPoints = doneTasks.reduce((acc, t) => {
    const pts = parseInt(t.estimate?.replace(/\D/g, "") || "0", 10);
    return acc + (pts || 3);
  }, 0);

  sprint.completedPoints = completedPoints;
  sprint.remainingPoints = Math.max(0, sprint.totalPoints - completedPoints);

  // Record velocity
  db.velocityHistory.push({
    sprintId: sprint.id,
    sprintName: sprint.name.split(":")[0].trim(),
    committedPoints: sprint.totalPoints,
    completedPoints: completedPoints,
    completionRate: Math.round((completedPoints / (sprint.totalPoints || 1)) * 100)
  });

  // Rollover incomplete tasks
  let rolledOverCount = 0;
  if (rolloverTargetId && incompleteTasks.length > 0) {
    const targetSprint = db.sprints.find((s) => s.id === rolloverTargetId);
    if (targetSprint) {
      incompleteTasks.forEach((t) => {
        if (!targetSprint.taskIds.includes(t.id)) {
          targetSprint.taskIds.push(t.id);
          rolledOverCount++;
        }
      });
    }
  }

  // Activate next planned sprint if available
  const nextPlanned = db.sprints.find((s) => s.status === "planned");
  if (nextPlanned) {
    nextPlanned.status = "active";
  }

  saveSprintsDB(db);

  broadcastEvent({
    type: "system",
    category: "system",
    title: "Sprint Completed",
    message: `${sprint.name} completed with ${completedPoints} pts burned!`,
    link: "/app/sprints"
  });

  return { completedSprint: sprint, rolledOverCount };
}

export function startSprint(sprintId: string): Sprint {
  const db = loadSprintsDB();
  const target = db.sprints.find((s) => s.id === sprintId);
  if (!target) throw new Error("Sprint not found");

  // Deactivate any currently active sprint
  db.sprints.forEach((s) => {
    if (s.status === "active" && s.id !== sprintId) {
      s.status = "planned";
    }
  });

  target.status = "active";
  target.currentDay = 1;
  saveSprintsDB(db);

  broadcastEvent({
    type: "system",
    category: "system",
    title: "New Sprint Started",
    message: `${target.name} has officially kicked off!`,
    link: "/app/sprints"
  });

  return target;
}

export function recalculateSprintPoints(): void {
  const db = loadSprintsDB();
  const allTasks = workspaceDB.getTasks();

  db.sprints.forEach((sprint) => {
    if (sprint.status === "completed") return;

    const tasks = allTasks.filter((t) => sprint.taskIds.includes(t.id));
    let total = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const pts = parseInt(t.estimate?.replace(/\D/g, "") || "0", 10) || 3;
      total += pts;
      if (t.status === "done") {
        completed += pts;
      }
    });

    sprint.totalPoints = total || sprint.totalPoints;
    sprint.completedPoints = completed;
    sprint.remainingPoints = Math.max(0, sprint.totalPoints - completed);

    // Update current day actual in burndown
    if (sprint.status === "active" && sprint.burndown && sprint.burndown.length > 0) {
      const dayEntry = sprint.burndown.find((b) => b.day === sprint.currentDay);
      if (dayEntry) {
        dayEntry.actualRemaining = sprint.remainingPoints;
      }
    }
  });

  saveSprintsDB(db);
}
