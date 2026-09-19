import mongoose from "mongoose";
import { Request, Response } from "express";
import { ProjectModel } from "../models";
import { db as workspaceDB } from "../services/db";

export const projectController = {
  async getProjects(_req: Request, res: Response) {
    if (mongoose.connection.readyState === 1) {
      try {
        const projects = await ProjectModel.find().sort({ createdAt: -1 });
        return res.json({ success: true, projects });
      } catch (dbErr) {
        console.warn("[ProjectModel] Mongo query fallback:", dbErr);
      }
    }

    const projects = workspaceDB.getProjects();
    res.json({ success: true, projects });
  },

  async createProject(req: Request, res: Response) {
    try {
      const { name, slug, description, repository } = req.body;
      const created = workspaceDB.createProject({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: description || "",
        sprint: "Sprint 24",
        progressPercent: 0,
        cycleTime: "1.4d",
        velocity: "38 pts",
        activeBranch: "main",
        repository: repository || "github.com/nova-corp/core",
      });

      try {
        await ProjectModel.create(created);
      } catch {}

      res.status(201).json({ success: true, project: created });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
};
