import { Request, Response } from "express";
import { releaseService } from "../services/releaseService";

export const releaseController = {
  async getReleases(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { projectId } = req.query;

      const releases = await releaseService.getReleases(orgId, projectId as string);
      return res.json({
        success: true,
        count: releases.length,
        releases,
        release: releases[0] || null,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateRelease(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user || { name: "Deployment Engine", initials: "DE" };
      const { canaryPercentage, status, action, id } = req.body;

      const releases = await releaseService.getReleases(orgId);
      const targetId = id || releases[0]?.id;

      if (!targetId) {
        return res.status(404).json({ success: false, error: "No active release found in organization." });
      }

      if (action === "rerun_preflight") {
        const checked = await releaseService.runPreflightChecks(orgId, targetId);
        return res.json({ success: true, release: checked });
      }

      const updates: any = {};
      if (typeof canaryPercentage === "number") {
        updates.canaryPercentage = canaryPercentage;
        if (canaryPercentage === 100) updates.status = "released";
        else if (canaryPercentage > 0) updates.status = "canary";
      }
      if (status) updates.status = status;

      const updated = await releaseService.updateRelease(orgId, targetId, updates, user.name, user.initials);
      return res.json({ success: true, release: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
