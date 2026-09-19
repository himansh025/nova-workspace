import mongoose from "mongoose";
import { Request, Response } from "express";
import { SpecModel } from "../models";
import { db as workspaceDB } from "../services/db";

export const specController = {
  async getSpecs(req: Request, res: Response) {
    try {
      const { status } = req.query;

      if (mongoose.connection.readyState === 1) {
        try {
          const filter: any = {};
          if (status && typeof status === "string") filter.status = status;
          const specs = await SpecModel.find(filter).sort({ updatedAt: -1 });
          return res.json({ success: true, specs });
        } catch (dbErr) {
          console.warn("[SpecModel] Mongo query fallback:", dbErr);
        }
      }

      const specs = workspaceDB.getSpecs(status as any);
      res.json({ success: true, specs });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createSpec(req: Request, res: Response) {
    try {
      const body = req.body;
      const spec = workspaceDB.createSpec({
        title: body.title,
        summary: body.summary || "",
        content: body.content || "",
        projectId: body.projectId || "prj-1",
        authorId: body.author?.id || "usr-1",
        tags: body.tags || ["Architecture"],
      });

      try {
        await SpecModel.create(spec);
      } catch {}

      res.status(201).json({ success: true, spec });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateSpec(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updates = req.body;
      const spec = workspaceDB.updateSpec(id, updates);
      if (!spec) return res.status(404).json({ success: false, error: "Spec not found" });

      try {
        await SpecModel.findOneAndUpdate({ $or: [{ id }, { key: id }] }, updates, { returnDocument: "after" });
      } catch {}

      res.json({ success: true, spec });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
};
