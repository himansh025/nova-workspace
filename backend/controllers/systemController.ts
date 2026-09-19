import mongoose from "mongoose";
import { Request, Response } from "express";
import { TaskModel, SpecModel, ProjectModel, ReleaseModel, ActivityItemModel } from "../models";
import { getMongoState } from "../config/db";
import { seedMongoDB } from "../seed";
import { db as workspaceDB } from "../services/db";
import { ENV } from "../config/env";

export const systemController = {
  async health(_req: Request, res: Response) {
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
      server: "Node.js Express Modular Backend",
      port: ENV.PORT,
      timestamp: new Date().toISOString(),
      mongodb: mongoState,
      recordCounts: counts,
    });
  },

  getAnalytics(_req: Request, res: Response) {
    try {
      const analytics = workspaceDB.getAnalytics();
      res.json({ success: true, analytics });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getActivity(_req: Request, res: Response) {
    try {
      if (mongoose.connection.readyState === 1) {
        try {
          const activities = await ActivityItemModel.find().sort({ timestamp: -1 }).limit(20);
          return res.json({ success: true, activities });
        } catch (dbErr) {
          console.warn("[ActivityItemModel] Mongo query fallback:", dbErr);
        }
      }

      const activities = workspaceDB.getActivities();
      res.json({ success: true, activities });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  aiChat(req: Request, res: Response) {
    try {
      const { presetId } = req.body;
      const tasks = workspaceDB.getTasks();
      const specs = workspaceDB.getSpecs();
      const urgentTasks = tasks.filter((t) => t.priority === "urgent");

      let summary = `Analyzed workspace context (${tasks.length} tasks, ${specs.length} specs).`;
      let bullets = [
        `Active issues: ${tasks.length} total, with ${urgentTasks.length} marked urgent.`,
        `Specs under review: ${specs.filter((s) => s.status !== "approved").length} active drafting specs.`,
        `Deployment health: Preflight checks passing with 0 reported security regressions.`,
      ];

      if (presetId === "summarize") {
        summary = "Sprint 24 velocity is on pace (+5 pts ahead of schedule).";
        bullets = [
          "Zero-copy binary buffer compaction completed and verified.",
          "Canary traffic currently promoted to 25% across edge regions.",
          "Remaining sprint scope: 16 story points scheduled across 3 active tickets.",
        ];
      } else if (presetId === "find-blockers") {
        summary = urgentTasks.length > 0 ? `Found ${urgentTasks.length} critical priority issues needing review.` : "No blocking issues identified in active sprint scope.";
        bullets = urgentTasks.map((t) => `${t.key}: ${t.title} (${t.assignee.name})`);
      }

      res.json({
        success: true,
        id: `ai-${Date.now()}`,
        summary,
        bullets,
        citations: urgentTasks.map((t) => ({ key: t.key, title: t.title })),
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  aiGenerateCode(req: Request, res: Response) {
    try {
      const { specId, language } = req.body;
      const spec = workspaceDB.getSpecById(specId);
      const lang = language || "typescript";

      const codeSnippets: Record<string, string> = {
        typescript: `// Auto-generated TypeScript implementation from ${spec?.key || "SPEC"}
export class DistributedStateSyncEngine {
  private stateVersion: number = 1;

  public async syncState(payload: Record<string, unknown>): Promise<{ status: string; version: number }> {
    console.log("[SyncEngine] Synchronizing CRDT state via Express + Nova engine...", payload);
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
  },

  async resetDatabase(_req: Request, res: Response) {
    try {
      await seedMongoDB(true);
      workspaceDB.resetDatabase();
      res.json({ success: true, message: "Workspace database successfully reseeded with baseline data." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
