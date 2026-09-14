import fs from "fs";
import path from "path";
import {
  WorkspaceDB,
  Project,
  Task,
  Spec,
  Release,
  TeamMember,
  ActivityItem,
  AnalyticsData,
  TaskStatus,
  TaskPriority
} from "./types";
import { initialWorkspaceDB } from "./seed";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "nova-db.json");

let memoryCache: WorkspaceDB | null = null;

function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDB(): WorkspaceDB {
  if (memoryCache) {
    return memoryCache;
  }

  ensureDataDirectory();

  if (!fs.existsSync(DB_FILE)) {
    saveDB(initialWorkspaceDB);
    memoryCache = JSON.parse(JSON.stringify(initialWorkspaceDB));
    return memoryCache!;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    memoryCache = JSON.parse(raw) as WorkspaceDB;
    return memoryCache;
  } catch (error) {
    console.error("Error loading Nova DB, reverting to initial seed:", error);
    saveDB(initialWorkspaceDB);
    memoryCache = JSON.parse(JSON.stringify(initialWorkspaceDB));
    return memoryCache!;
  }
}

function saveDB(data: WorkspaceDB): void {
  ensureDataDirectory();
  const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
    memoryCache = data;
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    memoryCache = data;
  }
}

export const db = {
  // Projects
  getProjects(): Project[] {
    const data = loadDB();
    return data.projects;
  },

  getProjectById(id: string): Project | undefined {
    const data = loadDB();
    return data.projects.find((p) => p.id === id || p.slug === id);
  },

  createProject(input: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
    const data = loadDB();
    const newProject: Project = {
      ...input,
      id: `prj-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.projects.push(newProject);
    data.activities.unshift({
      id: `act-${Date.now()}`,
      type: "commit",
      actor: { name: "System", initials: "SY" },
      action: "created project workspace",
      target: newProject.name,
      timestamp: "Just now"
    });
    saveDB(data);
    return newProject;
  },

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const data = loadDB();
    const index = data.projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    data.projects[index] = {
      ...data.projects[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveDB(data);
    return data.projects[index];
  },

  // Tasks
  getTasks(filter?: {
    projectId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    search?: string;
  }): Task[] {
    const data = loadDB();
    let tasks = data.tasks;

    if (filter?.projectId) {
      tasks = tasks.filter((t) => t.projectId === filter.projectId);
    }
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    if (filter?.priority) {
      tasks = tasks.filter((t) => t.priority === filter.priority);
    }
    if (filter?.assigneeId) {
      tasks = tasks.filter((t) => t.assignee.id === filter.assigneeId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.key.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return tasks;
  },

  getTaskById(id: string): Task | undefined {
    const data = loadDB();
    return data.tasks.find((t) => t.id === id || t.key === id);
  },

  createTask(input: {
    projectId?: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: string;
    tags?: string[];
    branch?: string;
    estimate?: string;
  }): Task {
    const data = loadDB();
    const existingKeys = data.tasks
      .map((t) => parseInt(t.key.replace("NV-", ""), 10))
      .filter((n) => !isNaN(n));
    const nextKeyNum = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 881;
    const taskKey = `NV-${nextKeyNum}`;

    let assignee = {
      id: "usr-1",
      name: "Elena Rostova",
      avatar: "",
      initials: "ER"
    };

    if (input.assigneeId) {
      const found = data.team.find((u) => u.id === input.assigneeId);
      if (found) {
        assignee = {
          id: found.id,
          name: found.name,
          avatar: found.avatar,
          initials: found.initials
        };
      }
    }

    const newTask: Task = {
      id: `tsk-${Date.now().toString(36)}`,
      key: taskKey,
      projectId: input.projectId || "prj-1",
      title: input.title,
      description: input.description || "",
      status: input.status || "backlog",
      priority: input.priority || "medium",
      assignee,
      tags: input.tags || ["General"],
      branch: input.branch,
      estimate: input.estimate || "3 pts",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.tasks.unshift(newTask);

    // Update team member task count
    const member = data.team.find((m) => m.id === assignee.id);
    if (member) {
      member.activeTasksCount += 1;
    }

    data.activities.unshift({
      id: `act-${Date.now()}`,
      type: "task_created",
      actor: { name: assignee.name, initials: assignee.initials },
      action: "created issue",
      target: `${newTask.key} (${newTask.title})`,
      timestamp: "Just now"
    });

    saveDB(data);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Task>): Task | null {
    const data = loadDB();
    const index = data.tasks.findIndex((t) => t.id === id || t.key === id);
    if (index === -1) return null;

    const prevTask = data.tasks[index];
    const updatedTask: Task = {
      ...prevTask,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    data.tasks[index] = updatedTask;

    // Log status transition activity if status changed
    if (updates.status && updates.status !== prevTask.status) {
      data.activities.unshift({
        id: `act-${Date.now()}`,
        type: "task_status",
        actor: { name: updatedTask.assignee.name, initials: updatedTask.assignee.initials },
        action: `moved to ${updates.status.replace("_", " ").toUpperCase()}`,
        target: updatedTask.key,
        timestamp: "Just now"
      });
    }

    saveDB(data);
    return updatedTask;
  },

  deleteTask(id: string): boolean {
    const data = loadDB();
    const index = data.tasks.findIndex((t) => t.id === id || t.key === id);
    if (index === -1) return false;

    const removed = data.tasks.splice(index, 1)[0];
    const member = data.team.find((m) => m.id === removed.assignee.id);
    if (member && member.activeTasksCount > 0) {
      member.activeTasksCount -= 1;
    }

    saveDB(data);
    return true;
  },

  // Specs
  getSpecs(filter?: { projectId?: string; status?: Spec["status"] }): Spec[] {
    const data = loadDB();
    let specs = data.specs;
    if (filter?.projectId) {
      specs = specs.filter((s) => s.projectId === filter.projectId);
    }
    if (filter?.status) {
      specs = specs.filter((s) => s.status === filter.status);
    }
    return specs;
  },

  getSpecById(id: string): Spec | undefined {
    const data = loadDB();
    return data.specs.find((s) => s.id === id || s.key === id);
  },

  createSpec(input: {
    projectId?: string;
    title: string;
    summary: string;
    content: string;
    tags?: string[];
    authorId?: string;
  }): Spec {
    const data = loadDB();
    const existingKeys = data.specs
      .map((s) => parseInt(s.key.replace("SPEC-", ""), 10))
      .filter((n) => !isNaN(n));
    const nextKeyNum = existingKeys.length > 0 ? Math.max(...existingKeys) + 1 : 107;
    const specKey = `SPEC-${nextKeyNum}`;

    let author = {
      id: "usr-1",
      name: "Elena Rostova",
      initials: "ER"
    };

    if (input.authorId) {
      const found = data.team.find((u) => u.id === input.authorId);
      if (found) {
        author = {
          id: found.id,
          name: found.name,
          initials: found.initials
        };
      }
    }

    const newSpec: Spec = {
      id: `spec-${Date.now().toString(36)}`,
      key: specKey,
      projectId: input.projectId || "prj-1",
      title: input.title,
      summary: input.summary,
      content: input.content,
      status: "drafting",
      author,
      tags: input.tags || ["Architecture"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.specs.unshift(newSpec);
    data.activities.unshift({
      id: `act-${Date.now()}`,
      type: "commit",
      actor: author,
      action: "drafted specification",
      target: `${newSpec.key} (${newSpec.title})`,
      timestamp: "Just now"
    });

    saveDB(data);
    return newSpec;
  },

  updateSpec(id: string, updates: Partial<Spec>): Spec | null {
    const data = loadDB();
    const index = data.specs.findIndex((s) => s.id === id || s.key === id);
    if (index === -1) return null;

    const prevSpec = data.specs[index];
    const updatedSpec: Spec = {
      ...prevSpec,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    data.specs[index] = updatedSpec;

    if (updates.status === "approved" && prevSpec.status !== "approved") {
      data.activities.unshift({
        id: `act-${Date.now()}`,
        type: "spec_approved",
        actor: { name: "Elena Rostova", initials: "ER" },
        action: "approved specification",
        target: `${updatedSpec.key} (${updatedSpec.title})`,
        timestamp: "Just now"
      });
    }

    saveDB(data);
    return updatedSpec;
  },

  deleteSpec(id: string): boolean {
    const data = loadDB();
    const index = data.specs.findIndex((s) => s.id === id || s.key === id);
    if (index === -1) return false;
    data.specs.splice(index, 1);
    saveDB(data);
    return true;
  },

  // Releases
  getReleases(projectId?: string): Release[] {
    const data = loadDB();
    if (projectId) {
      return data.releases.filter((r) => r.projectId === projectId);
    }
    return data.releases;
  },

  getReleaseById(id: string): Release | undefined {
    const data = loadDB();
    return data.releases.find((r) => r.id === id || r.version === id);
  },

  updateRelease(
    id: string,
    updates: Partial<Release>
  ): Release | null {
    const data = loadDB();
    const index = data.releases.findIndex((r) => r.id === id || r.version === id);
    if (index === -1) return null;

    const prev = data.releases[index];
    const updated: Release = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.canaryPercentage !== undefined && updates.canaryPercentage !== prev.canaryPercentage) {
      data.activities.unshift({
        id: `act-${Date.now()}`,
        type: "release",
        actor: { name: "Deployment Engine", initials: "DE" },
        action: `updated canary rollout to ${updates.canaryPercentage}%`,
        target: updated.version,
        timestamp: "Just now"
      });
    }

    if (updates.status === "released" && prev.status !== "released") {
      updated.canaryPercentage = 100;
      updated.releasedAt = new Date().toISOString();
      data.activities.unshift({
        id: `act-${Date.now()}`,
        type: "release",
        actor: { name: "Production SRE", initials: "SRE" },
        action: "promoted release to 100% General Availability",
        target: updated.version,
        timestamp: "Just now"
      });
    }

    data.releases[index] = updated;
    saveDB(data);
    return updated;
  },

  runPreflightChecks(releaseId: string): Release | null {
    const data = loadDB();
    const index = data.releases.findIndex((r) => r.id === releaseId || r.version === releaseId);
    if (index === -1) return null;

    const release = data.releases[index];
    release.checks = release.checks.map((chk) => ({
      ...chk,
      status: "passed"
    }));
    release.checksPassed = release.checks.length;
    release.totalChecks = release.checks.length;
    release.updatedAt = new Date().toISOString();

    data.activities.unshift({
      id: `act-${Date.now()}`,
      type: "release",
      actor: { name: "Automated Pipeline", initials: "CI" },
      action: "passed all preflight verification checks",
      target: release.version,
      timestamp: "Just now"
    });

    saveDB(data);
    return release;
  },

  // Team
  getTeam(): TeamMember[] {
    const data = loadDB();
    return data.team;
  },

  addTeamMember(input: Omit<TeamMember, "id" | "activeTasksCount">): TeamMember {
    const data = loadDB();
    const newMember: TeamMember = {
      ...input,
      id: `usr-${Date.now().toString(36)}`,
      activeTasksCount: 0
    };
    data.team.push(newMember);
    data.activities.unshift({
      id: `act-${Date.now()}`,
      type: "member_joined",
      actor: { name: newMember.name, initials: newMember.initials },
      action: "joined workspace squad",
      target: newMember.role,
      timestamp: "Just now"
    });
    saveDB(data);
    return newMember;
  },

  // Activities
  getActivities(limit: number = 20): ActivityItem[] {
    const data = loadDB();
    return data.activities.slice(0, limit);
  },

  // Analytics
  getAnalytics(): AnalyticsData {
    const data = loadDB();
    const tasks = data.tasks;

    const tasksByStatus: Record<TaskStatus, number> = {
      backlog: tasks.filter((t) => t.status === "backlog").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      done: tasks.filter((t) => t.status === "done").length
    };

    const tasksByPriority: Record<TaskPriority, number> = {
      urgent: tasks.filter((t) => t.priority === "urgent").length,
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length
    };

    return {
      cycleTimeDays: 1.4,
      cycleTimeDelta: "-42% vs last month",
      velocitySprintDelta: "+24% ahead of baseline",
      reviewLatencyHours: 2.1,
      throughputPerSprint: 48,
      chartPoints: [
        { label: "Mon", completed: 24, velocity: 18, throughput: 28 },
        { label: "Tue", completed: 38, velocity: 26, throughput: 34 },
        { label: "Wed", completed: 32, velocity: 30, throughput: 40 },
        { label: "Thu", completed: 52, velocity: 34, throughput: 46 },
        { label: "Fri", completed: 68, velocity: 45, throughput: 55 },
        { label: "Sat", completed: 42, velocity: 48, throughput: 42 },
        { label: "Sun", completed: 74, velocity: 56, throughput: 60 }
      ],
      tasksByStatus,
      tasksByPriority
    };
  },

  // Settings
  getSettings() {
    const data = loadDB();
    return data.settings;
  },

  updateSettings(updates: Partial<WorkspaceDB["settings"]>) {
    const data = loadDB();
    data.settings = { ...data.settings, ...updates };
    saveDB(data);
    return data.settings;
  },

  // Reset
  resetDatabase(): void {
    saveDB(JSON.parse(JSON.stringify(initialWorkspaceDB)));
  }
};
