import { Request, Response } from "express";
import { taskService } from "../services/taskService";
import { TaskStatus, TaskPriority } from "../services/types";
import {
  resolveProjectAccess,
  getAccessibleProjectIds,
  canAccessProject,
} from "../services/projectAccessService";
import { canUserModifyTask, canUserDeleteTask } from "../services/taskAccessService";

export const taskController = {
  async getTasks(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { status, priority, search, page, limit, projectId } = req.query;

      const access = await resolveProjectAccess(req);
      const accessibleIds = access.isPrivileged ? undefined : await getAccessibleProjectIds(access);

      if (projectId && typeof projectId === "string") {
        if (!(await canAccessProject(access, projectId))) {
          return res.json({ success: true, count: 0, tasks: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } });
        }
      }

      const result = await taskService.getTasks({
        organizationId: orgId,
        projectId: projectId as string,
        projectIds: projectId ? undefined : accessibleIds,
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

      const access = await resolveProjectAccess(req);
      const targetProjectId = body.projectId as string | undefined;
      if (targetProjectId && !(await canAccessProject(access, targetProjectId))) {
        return res.status(403).json({ success: false, error: "You cannot create tasks in this project." });
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
        creatorUserId: user.id,
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

      const existing = await taskService.getTaskById(orgId, id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Task not found." });
      }

      const access = await resolveProjectAccess(req);
      if (!(await canAccessProject(access, existing.projectId))) {
        return res.status(403).json({ success: false, error: "You do not have access to this task's project." });
      }

      if (updates.projectId && typeof updates.projectId === "string") {
        if (!(await canAccessProject(access, updates.projectId))) {
          return res.status(403).json({ success: false, error: "You cannot move this task to that project." });
        }
      }

      if (!(await canUserModifyTask(req, existing))) {
        return res.status(403).json({
          success: false,
          error:
            "You can only update tasks you created, tasks assigned to you, or tasks you are permitted to manage.",
        });
      }

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

      const existing = await taskService.getTaskById(orgId, id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Task not found." });
      }

      const access = await resolveProjectAccess(req);
      if (!(await canAccessProject(access, existing.projectId))) {
        return res.status(403).json({ success: false, error: "You do not have access to this task's project." });
      }

      if (!(await canUserDeleteTask(req, existing))) {
        return res.status(403).json({
          success: false,
          error:
            "You can only delete tasks you created, tasks assigned to you (with delete permission), or if you are an organization owner/admin.",
        });
      }

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
