import { Request, Response } from "express";
import { ProjectModel } from "../models/Project";
import {
  resolveProjectAccess,
  projectVisibilityFilter,
  canAccessProject,
} from "../services/projectAccessService";

export const projectController = {
  async getProjects(req: Request, res: Response) {
    try {
      const access = await resolveProjectAccess(req);
      const projects = await ProjectModel.find(projectVisibilityFilter(access)).sort({ createdAt: -1 });
      return res.json({ success: true, count: projects.length, projects });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async createProject(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { name, slug, description, repository, sprint, teamGroupId } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: "Project name is required." });
      }

      const project = await ProjectModel.create({
        id: `prj-${Date.now().toString(36)}`,
        organizationId: orgId,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        description: description || "",
        sprint: sprint || "Sprint 1",
        progressPercent: 0,
        cycleTime: "--",
        velocity: "0 pts",
        activeBranch: "main",
        repository: repository || "github.com/organization/main",
        teamGroupId: teamGroupId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return res.status(201).json({ success: true, project });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateProject(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const updates = req.body;
      const access = await resolveProjectAccess(req);
      if (!(await canAccessProject(access, id as string))) {
        return res.status(403).json({ success: false, error: "You do not have access to this project." });
      }

      const project = await ProjectModel.findOneAndUpdate(
        { id, organizationId: orgId },
        { ...updates, updatedAt: new Date().toISOString() },
        { new: true }
      );
      
      if (!project) return res.status(404).json({ success: false, error: "Project not found" });
      return res.json({ success: true, project });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteProject(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const access = await resolveProjectAccess(req);
      if (!(await canAccessProject(access, id as string))) {
        return res.status(403).json({ success: false, error: "You do not have access to this project." });
      }

      const project = await ProjectModel.findOneAndDelete({ id, organizationId: orgId });
      if (!project) return res.status(404).json({ success: false, error: "Project not found" });
      
      return res.json({ success: true, message: "Project deleted successfully" });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  }
};
