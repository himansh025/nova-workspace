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

import os from "os";

function resolveDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), ".nova-data");
  }
  try {
    const localDir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    return path.join(os.tmpdir(), ".nova-data");
  }
}

let DATA_DIR = resolveDataDir();
let SPRINTS_FILE = path.join(DATA_DIR, "nova-sprints.json");

const INITIAL_SPRINTS_DATA: SprintsDB = {
  sprints: [],
  velocityHistory: [],
  pokerVotes: {},
};

let sprintCache: SprintsDB | null = null;

function ensureDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    try {
      DATA_DIR = path.join(os.tmpdir(), ".nova-data");
      SPRINTS_FILE = path.join(DATA_DIR, "nova-sprints.json");
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch {
      // In-memory fallback
    }
  }
}

function loadSprintsDB(): SprintsDB {
  if (sprintCache) return sprintCache;
  ensureDir();

  try {
    if (fs.existsSync(SPRINTS_FILE)) {
      const raw = fs.readFileSync(SPRINTS_FILE, "utf-8");
      sprintCache = JSON.parse(raw) as SprintsDB;
      return sprintCache;
    }
  } catch (err) {
    console.warn("Could not read SPRINTS_FILE, using clean state:", err);
  }

  sprintCache = JSON.parse(JSON.stringify(INITIAL_SPRINTS_DATA));
  return sprintCache!;
}

function saveSprintsDB(data: SprintsDB): void {
  sprintCache = data;
  try {
    ensureDir();
    fs.writeFileSync(SPRINTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Sprints disk write skipped (read-only filesystem):", err);
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
