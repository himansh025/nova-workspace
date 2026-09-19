import mongoose from "mongoose";
import { Request, Response } from "express";
import { ReleaseModel } from "../models";
import { db as workspaceDB } from "../services/db";

export const releaseController = {
  async getReleases(_req: Request, res: Response) {
    try {
      if (mongoose.connection.readyState === 1) {
        try {
          const releases = await ReleaseModel.find().sort({ createdAt: -1 });
          return res.json({ success: true, releases, release: releases[0] || null });
        } catch (dbErr) {
          console.warn("[ReleaseModel] Mongo query fallback:", dbErr);
        }
      }

      const releases = workspaceDB.getReleases();
      res.json({ success: true, releases, release: releases[0] || null });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  updateRelease(req: Request, res: Response) {
    try {
      const { canaryPercentage, status, action, id } = req.body;
      const releases = workspaceDB.getReleases();
      const release = id ? workspaceDB.getReleaseById(id) : releases[0];

      if (!release) {
        return res.status(404).json({ success: false, error: "No active release found" });
      }

      if (action === "rerun_preflight") {
        workspaceDB.runPreflightChecks(release.id);
      }

      const updates: any = {};
      if (typeof canaryPercentage === "number") {
        updates.canaryPercentage = canaryPercentage;
        if (canaryPercentage === 100) updates.status = "released";
        else if (canaryPercentage > 0) updates.status = "canary";
      }
      if (status) updates.status = status;

      const updated = workspaceDB.updateRelease(release.id, updates);
      res.json({ success: true, release: updated });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
};
