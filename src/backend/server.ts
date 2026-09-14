import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectMongoDB, getMongoState } from "./db";
import { seedMongoDB } from "./seed";
import {
  TaskModel,
  SpecModel,
  ProjectModel,
  ReleaseModel,
  TeamMemberModel,
  ActivityItemModel,
} from "./models";
import { subscribeToEvents, getNotificationHistory } from "../server/events";

const app = express();
const PORT = process.env.EXPRESS_PORT || process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[Express API] ${req.method} ${req.path}`);
  next();
});

// Helper for audit logging
async function logActivity(
  actorName: string,
  initials: string,
  action: string,
  target: string,
  type: "task_status" | "task_created" | "spec_approved" | "commit" | "release" | "member_joined"
) {
  try {
    const newItem = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      actor: { name: actorName, initials },
      action,
      target,
      timestamp: "Just now",
    };
    await ActivityItemModel.create(newItem);
  } catch (err) {
    console.warn("Failed to log activity to Mongo:", err);
  }
}

// ---------------------------------------------------------------------------
// Health & System Endpoint
// ---------------------------------------------------------------------------
app.get("/health", async (_req: Request, res: Response) => {
  const mongoState = getMongoState();
  let counts = {};
  if (mongoState.isConnected) {
    try {
      const [tasks, specs, projects, releases] = await Promise.all([
        TaskModel.countDocuments(),
        SpecModel.countDocuments(),
        ProjectModel.countDocuments(),
        ReleaseModel.countDocuments(),
      ]);
      counts = { tasks, specs, projects, releases };
    } catch {}
  }

  res.json({
    status: "online",
    server: "Node.js Express Server",
    port: PORT,
    timestamp: new Date().toISOString(),
    mongodb: mongoState,
    recordCounts: counts,
  });
});

// ---------------------------------------------------------------------------
// Server-Sent Events (SSE) Live Stream
// ---------------------------------------------------------------------------
app.get("/api/events", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send initial history
  res.write(
    `data: ${JSON.stringify({
      type: "init",
      history: getNotificationHistory(),
      connectedAt: new Date().toISOString(),
    })}\n\n`
  );

  const unsubscribe = subscribeToEvents((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

// ---------------------------------------------------------------------------
// Projects Routes
// ---------------------------------------------------------------------------
app.get("/api/projects", async (_req: Request, res: Response) => {
  try {
    const projects = await ProjectModel.find().sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/projects", async (req: Request, res: Response) => {
  try {
    const { name, slug, description, repository } = req.body;
    const now = new Date().toISOString();
    const newProject = await ProjectModel.create({
      id: `prj-${Date.now()}`,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || "",
      sprint: "Sprint 42",
      progressPercent: 0,
      cycleTime: "1.4d",
      velocity: "48 pts",
      activeBranch: "main",
      repository,
      createdAt: now,
      updatedAt: now,
    });
    await logActivity("System Admin", "SA", "created project workspace", name, "commit");
    res.status(201).json({ success: true, project: newProject });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Tasks Routes (Full CRUD & Search/Filter)
// ---------------------------------------------------------------------------
app.get("/api/tasks", async (req: Request, res: Response) => {
  try {
    const { status, priority, search } = req.query;
    const filter: any = {};

    if (status && typeof status === "string") filter.status = status;
    if (priority && typeof priority === "string") filter.priority = priority;
    if (search && typeof search === "string") {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { key: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await TaskModel.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, count: tasks.length, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/tasks", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const count = await TaskModel.countDocuments();
    const key = body.key || `NV-${880 + count + 1}`;
    const id = body.id || `tsk-${Date.now()}`;
    const now = new Date().toISOString();

    const task = await TaskModel.create({
      id,
      key,
      title: body.title,
      description: body.description || "",
      status: body.status || "backlog",
      priority: body.priority || "medium",
      assignee: body.assignee || {
        id: "usr-1",
        name: "Elena Rostova",
        avatar: "",
        initials: "ER",
      },
      projectId: body.projectId || "prj-1",
      tags: body.tags || ["General"],
      branch: body.branch || `feat/${key.toLowerCase()}`,
      estimate: body.estimate || "3 pts",
      createdAt: now,
      updatedAt: now,
    });

    await logActivity("Elena Rostova", "ER", "created issue", `${task.key} (${task.title})`, "task_created");
    res.status(201).json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    const task = await TaskModel.findOneAndUpdate(
      { $or: [{ id }, { key: id }] },
      updates,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    if (req.body.status) {
      await logActivity(
        task.assignee.name,
        task.assignee.initials,
        `moved issue to ${req.body.status.replace("_", " ")}`,
        `${task.key} (${task.title})`,
        "task_status"
      );
    }

    res.json({ success: true, task });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await TaskModel.findOneAndDelete({ $or: [{ id }, { key: id }] });
    if (!task) return res.status(404).json({ success: false, error: "Task not found" });
    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Architecture Specs Routes
// ---------------------------------------------------------------------------
app.get("/api/specs", async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status && typeof status === "string") filter.status = status;
    const specs = await SpecModel.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, specs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/specs", async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const count = await SpecModel.countDocuments();
    const key = body.key || `SPEC-${105 + count}`;
    const id = body.id || `spec-${Date.now()}`;
    const now = new Date().toISOString();

    const spec = await SpecModel.create({
      id,
      key,
      title: body.title,
      summary: body.summary || "",
      content: body.content || "",
      status: body.status || "drafting",
      author: body.author || {
        id: "usr-1",
        name: "Elena Rostova",
        initials: "ER",
      },
      projectId: body.projectId || "prj-1",
      tags: body.tags || ["Architecture"],
      createdAt: now,
      updatedAt: now,
    });

    await logActivity("Elena Rostova", "ER", "drafted specification", `${spec.key} (${spec.title})`, "commit");
    res.status(201).json({ success: true, spec });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put("/api/specs/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body, updatedAt: new Date().toISOString() };
    const spec = await SpecModel.findOneAndUpdate(
      { $or: [{ id }, { key: id }] },
      updates,
      { new: true }
    );

    if (!spec) return res.status(404).json({ success: false, error: "Spec not found" });

    if (req.body.status === "approved") {
      await logActivity("Elena Rostova", "ER", "approved specification", `${spec.key} (${spec.title})`, "spec_approved");
    }

    res.json({ success: true, spec });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Release & Canary Pipeline Routes
// ---------------------------------------------------------------------------
app.get("/api/releases", async (_req: Request, res: Response) => {
  try {
    const releases = await ReleaseModel.find().sort({ createdAt: -1 });
    res.json({ success: true, releases, release: releases[0] || null });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/releases", async (req: Request, res: Response) => {
  try {
    const { canaryPercentage, status, action, id } = req.body;
    let release = id ? await ReleaseModel.findOne({ id }) : await ReleaseModel.findOne();

    if (!release) {
      return res.status(404).json({ success: false, error: "No active release found" });
    }

    if (typeof canaryPercentage === "number") {
      release.canaryPercentage = canaryPercentage;
      if (canaryPercentage === 100) release.status = "released";
      else if (canaryPercentage > 0) release.status = "canary";
    }

    if (status) release.status = status;

    if (action === "rerun_preflight") {
      release.checks = release.checks.map((chk: any) => ({
        ...chk,
        status: "passed",
      }));
      release.checksPassed = release.checks.length;
      await logActivity("CI Engine", "CI", "passed all preflight verification checks", release.version, "release");
    }

    release.updatedAt = new Date().toISOString();
    await release.save();

    if (typeof canaryPercentage === "number") {
      await logActivity("Deployment Engine", "DE", `updated canary rollout to ${release.canaryPercentage}%`, release.version, "release");
    }

    res.json({ success: true, release });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Team Routes
// ---------------------------------------------------------------------------
app.get("/api/team", async (_req: Request, res: Response) => {
  try {
    const team = await TeamMemberModel.find().sort({ name: 1 });
    res.json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/team", async (req: Request, res: Response) => {
  try {
    const { name, email, role, avatar, initials } = req.body;
    const member = await TeamMemberModel.create({
      id: `usr-${Date.now()}`,
      name,
      email,
      role: role || "Software Engineer",
      avatar: avatar || "",
      initials: initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
      status: "online",
      activeTasksCount: 0,
    });
    await logActivity(name, member.initials, "joined workspace squad", role, "member_joined");
    res.status(201).json({ success: true, member });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Telemetry & Analytics Route
// ---------------------------------------------------------------------------
app.get("/api/analytics", async (_req: Request, res: Response) => {
  try {
    const tasks = await TaskModel.find();
    const tasksByStatus = {
      backlog: tasks.filter((t) => t.status === "backlog").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      review: tasks.filter((t) => t.status === "review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
    const tasksByPriority = {
      urgent: tasks.filter((t) => t.priority === "urgent").length,
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };

    res.json({
      success: true,
      data: {
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
          { label: "Sun", completed: 74, velocity: 56, throughput: 60 },
        ],
        tasksByStatus,
        tasksByPriority,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Activity Feed Route
// ---------------------------------------------------------------------------
app.get("/api/activity", async (_req: Request, res: Response) => {
  try {
    const activities = await ActivityItemModel.find().sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, activities });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// AI Context Engine & Code Generator Routes
// ---------------------------------------------------------------------------
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    const tasks = await TaskModel.find();
    const specs = await SpecModel.find();
    const urgentTasks = tasks.filter((t) => t.priority === "urgent");

    const answer = `Analyzed workspace context against MongoDB records (${tasks.length} tasks, ${specs.length} specs).

Current Status:
• **Urgent Issues**: ${urgentTasks.length > 0 ? urgentTasks.map((t) => `${t.key}: ${t.title}`).join(", ") : "No critical urgent blockers detected."}
• **Architecture Specs**: ${specs.map((s) => `${s.key} (${s.status})`).join(", ")}
• **Recommendation**: Proceed with deployment of canary build once urgent tasks pass pre-flight verification.`;

    res.json({
      success: true,
      answer,
      citations: urgentTasks.map((t) => ({ id: t.id, title: t.title, type: "task" })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/ai/generate-code", async (req: Request, res: Response) => {
  try {
    const { specId, language } = req.body;
    const spec = await SpecModel.findOne({ $or: [{ id: specId }, { key: specId }] });
    const lang = language || "typescript";

    const codeSnippets: Record<string, string> = {
      typescript: `// Auto-generated TypeScript implementation from ${spec?.key || "SPEC"}
export class DistributedStateSyncEngine {
  private stateVersion: number = 1;

  public async syncState(payload: Record<string, unknown>): Promise<{ status: string; version: number }> {
    console.log("[SyncEngine] Synchronizing CRDT state via Express + MongoDB engine...", payload);
    this.stateVersion += 1;
    return { status: "OK", version: this.stateVersion };
  }
}`,
      rust: `// Auto-generated Rust implementation from ${spec?.key || "SPEC"}
pub struct DistributedSyncEngine {
    pub version: u64,
}

impl DistributedSyncEngine {
    pub fn new() -> Self {
        Self { version: 1 }
    }
}`,
    };

    const code = codeSnippets[lang.toLowerCase()] || codeSnippets["typescript"];

    res.json({ success: true, language: lang, code });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GitHub Webhook Simulator
// ---------------------------------------------------------------------------
app.post("/api/webhooks/github", async (req: Request, res: Response) => {
  try {
    const { event, branch, author } = req.body;
    const commitAuthor = author || "Marcus Vance";

    if (event === "push") {
      await logActivity(commitAuthor, "MV", `pushed git commit to ${branch || "main"}`, "main@4f81c9a", "commit");
    } else if (event === "pull_request_merged") {
      await logActivity(commitAuthor, "MV", `merged PR into ${branch || "main"}`, "PR #142 - Edge Compute Router", "commit");
    } else if (event === "ci_passed") {
      await logActivity("Automated Pipeline", "CI", "passed full CI/CD suite (1,240 tests)", "main@head", "release");
    }

    res.json({ success: true, message: `Handled ${event} event successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Reset Database Route
// ---------------------------------------------------------------------------
app.post("/api/reset", async (_req: Request, res: Response) => {
  try {
    await seedMongoDB(true);
    res.json({ success: true, message: "Local MongoDB successfully reseeded with baseline data." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Express Start Function
// ---------------------------------------------------------------------------
export async function startServer() {
  try {
    await connectMongoDB();
    await seedMongoDB(false);
  } catch (err) {
    console.warn("[Express Server] Launching without MongoDB active (will retry on connection).");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Node.js Express server running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

export default app;
