import { Request, Response } from "express";
import { taskService } from "../services/taskService";
import { TaskStatus, TaskPriority } from "../services/types";

export const taskController = {
  async getTasks(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { status, priority, search, page, limit, projectId } = req.query;

      const result = await taskService.getTasks({
        organizationId: orgId,
        projectId: projectId as string,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });

      return res.json({
        success: true,
        count: result.tasks.length,
        tasks: result.tasks,
        pagination: result.pagination,
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async createTask(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user || { name: "Engineering Team", initials: "ET" };
      const body = req.body;

      if (!body.title || typeof body.title !== "string") {
        return res.status(400).json({ success: false, error: "Task title is required." });
      }

      const task = await taskService.createTask({
        organizationId: orgId,
        projectId: body.projectId,
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: body.status,
        assigneeId: body.assignee?.id || body.assigneeId,
        tags: body.tags,
        branch: body.branch,
        estimate: body.estimate,
        creatorName: user.name,
        creatorInitials: user.initials,
      });

      return res.status(201).json({ success: true, task });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateTask(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user || { name: "Engineering Team", initials: "ET" };
      const id = req.params.id as string;
      const updates = req.body;

      const task = await taskService.updateTask(
        orgId,
        id,
        updates,
        user.name,
        user.initials
      );

      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found." });
      }

      return res.json({ success: true, task });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteTask(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;

      const deleted = await taskService.deleteTask(orgId, id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Task not found." });
      }

      return res.json({ success: true, deletedId: id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
