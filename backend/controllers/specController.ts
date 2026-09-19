import { Request, Response } from "express";
import { specService } from "../services/specService";

export const specController = {
  async getSpecs(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { projectId } = req.query;

      const specs = await specService.getSpecs(orgId, projectId as string);
      return res.json({ success: true, count: specs.length, specs });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getSpecById(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const spec = await specService.getSpecById(orgId, id);

      if (!spec) return res.status(404).json({ success: false, error: "Specification not found." });
      return res.json({ success: true, spec });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getRevisions(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const revisions = await specService.getSpecRevisions(orgId, id);
      return res.json({ success: true, count: revisions.length, revisions });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async createSpec(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user || { id: "usr-1", name: "Engineering Lead", initials: "EL" };
      const body = req.body;

      if (!body.title) {
        return res.status(400).json({ success: false, error: "Specification title is required." });
      }

      const spec = await specService.createSpec({
        organizationId: orgId,
        projectId: body.projectId,
        title: body.title,
        summary: body.summary || "",
        content: body.content || "",
        tags: body.tags,
        author: {
          id: user.id,
          name: user.name,
          initials: user.initials,
        },
      });

      return res.status(201).json({ success: true, spec });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateSpec(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user || { id: "usr-1", name: "Engineering Lead", initials: "EL" };
      const id = req.params.id as string;
      const updates = req.body;

      const spec = await specService.updateSpec(
        orgId,
        id,
        updates,
        { id: user.id, name: user.name, initials: user.initials }
      );

      if (!spec) return res.status(404).json({ success: false, error: "Spec not found." });
      return res.json({ success: true, spec });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteSpec(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const success = await specService.deleteSpec(orgId, id);
      if (!success) return res.status(404).json({ success: false, error: "Spec not found." });
      return res.json({ success: true, deletedId: id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
