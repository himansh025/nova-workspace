import { Request, Response } from "express";
import {
  getSprints,
  getActiveSprint,
  getSprintById,
  getVelocityHistory,
  getPokerVotes,
  castPokerVote,
  assignTaskToSprint,
  completeSprint,
  startSprint,
} from "../services/sprintData";
import { db as workspaceDB } from "../services/db";

export const sprintController = {
  getSprints(_req: Request, res: Response) {
    try {
      const sprints = getSprints();
      const activeSprint = getActiveSprint();
      const velocityHistory = getVelocityHistory();
      const allTasks = workspaceDB.getTasks();

      const activeTaskIds = new Set(activeSprint?.taskIds || []);
      const sprintTasks = allTasks.filter((t) => activeTaskIds.has(t.id));
      const backlogTasks = allTasks.filter((t) => !activeTaskIds.has(t.id));

      const avgVelocity =
        velocityHistory.length > 0
          ? Math.round(
              velocityHistory.reduce((acc, curr) => acc + curr.completedPoints, 0) /
                velocityHistory.length
            )
          : 38;

      res.json({
        success: true,
        sprints,
        activeSprint,
        velocityHistory,
        avgVelocity,
        sprintTasks,
        backlogTasks,
        allTasks,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch sprints: " + error.message });
    }
  },

  postAction(req: Request, res: Response) {
    try {
      const { action, sprintId } = req.body;
      if (action === "start" && sprintId) {
        const started = startSprint(sprintId);
        return res.json({ success: true, sprint: started });
      }
      return res.status(400).json({ error: "Invalid action" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getSprint(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const sprint = getSprintById(id);
      if (!sprint) return res.status(404).json({ error: "Sprint not found" });
      res.json({ success: true, sprint });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  patchSprint(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { taskId, action } = req.body;

      if (action === "assign" && taskId) {
        const updatedSprint = assignTaskToSprint(taskId, id);
        return res.json({ success: true, sprint: updatedSprint });
      }

      if (action === "unassign" && taskId) {
        const updatedSprint = assignTaskToSprint(taskId, null);
        return res.json({ success: true, sprint: updatedSprint });
      }

      return res.status(400).json({ error: "Invalid action or parameters" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  completeSprint(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { rolloverTargetId } = req.body;
      const result = completeSprint(id, rolloverTargetId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to complete sprint" });
    }
  },

  getPoker(req: Request, res: Response) {
    try {
      const taskId = req.query.taskId as string;
      if (!taskId) return res.status(400).json({ error: "Missing taskId" });
      const votes = getPokerVotes(taskId);
      res.json({ success: true, votes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  castPoker(req: Request, res: Response) {
    try {
      const { taskId, voter, points } = req.body;
      if (!taskId || !voter || points === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const result = castPokerVote(taskId, voter, points);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};
