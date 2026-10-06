import { Request, Response } from "express";
import { sprintService } from "../services/sprintService";
import { TaskModel } from "../models/Task";
import { resolveProjectAccess, getAccessibleProjectIds } from "../services/projectAccessService";

export const sprintController = {
  async getSprints(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const access = await resolveProjectAccess(req);
      const taskQuery: Record<string, unknown> = { organizationId: orgId };
      if (!access.isPrivileged) {
        const ids = await getAccessibleProjectIds(access);
        taskQuery.projectId = { $in: ids.length > 0 ? ids : ["__none__"] };
      }

      const [sprints, activeSprint, allTasks] = await Promise.all([
        sprintService.getSprints(orgId),
        sprintService.getActiveSprint(orgId),
        TaskModel.find(taskQuery).sort({ updatedAt: -1 }),
      ]);

      const activeTaskIds = new Set(activeSprint?.taskIds || []);
      const sprintTasks = allTasks.filter((t) => activeTaskIds.has(t.id));
      const backlogTasks = allTasks.filter((t) => !activeTaskIds.has(t.id));

      const completedSprints = sprints.filter((s) => s.status === "completed");
      const avgVelocity =
        completedSprints.length > 0
          ? Math.round(
              completedSprints.reduce((acc, curr) => acc + curr.completedPoints, 0) /
                completedSprints.length
            )
          : 24;

      return res.json({
        success: true,
        sprints,
        activeSprint,
        velocityHistory: completedSprints.map((s) => ({
          sprintId: s.id,
          sprintName: s.name,
          committedPoints: s.totalPoints,
          completedPoints: s.completedPoints,
          completionRate: s.totalPoints ? Math.round((s.completedPoints / s.totalPoints) * 100) : 100,
        })),
        avgVelocity,
        sprintTasks,
        backlogTasks,
        allTasks,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to fetch sprints: " + error.message });
    }
  },

  async createSprint(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { name, goal, startDate, endDate, totalDays, action, sprintId } = req.body;

      if (action === "start" && sprintId) {
        const sprint = await sprintService.startSprint(orgId, sprintId as string);
        return res.json({ success: true, sprint });
      }

      if (!name) {
        return res.status(400).json({ success: false, error: "Sprint name is required." });
      }

      const sprint = await sprintService.createSprint({
        organizationId: orgId,
        name,
        goal,
        startDate: startDate || new Date().toISOString().split("T")[0],
        endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        totalDays,
      });

      return res.status(201).json({ success: true, sprint });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async startSprint(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const sprint = await sprintService.startSprint(orgId, id as string);
      return res.json({ success: true, sprint });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async completeSprint(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const { rolloverTargetId } = req.body;

      const result = await sprintService.completeSprint(orgId, id as string, rolloverTargetId);
      return res.json({ success: true, ...result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async castVote(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { taskId, voter, points } = req.body;
      if (!taskId || !voter || points === undefined) {
        return res.status(400).json({ success: false, error: "taskId, voter, and points are required." });
      }

      const result = await sprintService.castPokerVote(orgId, taskId, voter, Number(points));
      return res.json({ success: true, result });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async assignTask(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { taskId, sprintId } = req.body;
      if (!taskId) {
        return res.status(400).json({ success: false, error: "taskId is required." });
      }

      const activeSprint = await sprintService.assignTaskToSprint(orgId, taskId, sprintId || null);
      return res.json({ success: true, activeSprint });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateOrAssignSprint(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const { taskId, action, name, goal, startDate, endDate, totalDays } = req.body;

      if (taskId) {
        const targetSprintId = action === "unassign" ? null : (id as string);
        const activeSprint = await sprintService.assignTaskToSprint(orgId, taskId, targetSprintId);
        return res.json({ success: true, activeSprint });
      }

      const updated = await sprintService.updateSprint(orgId, id as string, {
        name,
        goal,
        startDate,
        endDate,
        totalDays,
      });
      return res.json({ success: true, sprint: updated });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteSprint(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id } = req.params;
      const deleted = await sprintService.deleteSprint(orgId, id as string);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Sprint not found" });
      }
      return res.json({ success: true, id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
