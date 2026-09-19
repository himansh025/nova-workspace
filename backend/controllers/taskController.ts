import mongoose from "mongoose";
import { Request, Response } from "express";
import { TaskModel } from "../models";
import { db as workspaceDB } from "../services/db";

export const taskController = {
  async getTasks(req: Request, res: Response) {
    try {
      const { status, priority, search } = req.query;

      if (mongoose.connection.readyState === 1) {
        try {
          const filter: any = {};
          if (status && typeof status === "string") filter.status = status;
          if (priority && typeof priority === "string") filter.priority = priority;
          if (search && typeof search === "string") {
            filter.$or = [
              { title: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
              { key: { $regex: search, $options: "i" } },
            ];
          }

          const tasks = await TaskModel.find(filter).sort({ updatedAt: -1 });
          return res.json({ success: true, count: tasks.length, tasks });
        } catch (dbErr) {
          console.warn("[TaskModel] Mongo query fallback:", dbErr);
        }
      }

      const tasks = workspaceDB.getTasks({
        status: status as any,
        priority: priority as any,
        search: search as string,
      });
      res.json({ success: true, count: tasks.length, tasks });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async createTask(req: Request, res: Response) {
    try {
      const body = req.body;
      const task = workspaceDB.createTask({
        title: body.title,
        description: body.description || "",
        priority: body.priority || "medium",
        status: body.status || "backlog",
        projectId: body.projectId || "prj-1",
        assigneeId: body.assignee?.id || "usr-1",
        tags: body.tags || ["General"],
        branch: body.branch,
        estimate: body.estimate || "3 pts",
      });

      try {
        await TaskModel.create(task);
      } catch {}

      res.status(201).json({ success: true, task });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async updateTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updates = req.body;

      const task = workspaceDB.updateTask(id, updates);
      if (!task) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }

      try {
        await TaskModel.findOneAndUpdate({ $or: [{ id }, { key: id }] }, updates, { returnDocument: "after" });
      } catch {}

      res.json({ success: true, task });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  async deleteTask(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const deleted = workspaceDB.deleteTask(id);
      try {
        await TaskModel.findOneAndDelete({ $or: [{ id }, { key: id }] });
      } catch {}

      if (!deleted) return res.status(404).json({ success: false, error: "Task not found" });
      res.json({ success: true, deletedId: id });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
