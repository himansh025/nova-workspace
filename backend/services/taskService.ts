import { TaskModel, ITaskDocument } from "../models/Task";
import { ActivityItemModel } from "../models/Activity";
import { TeamMemberModel } from "../models/TeamMember";
import { broadcastEvent } from "./events";
import { TaskStatus, TaskPriority } from "./types";

export interface TaskFilter {
  organizationId: string;
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const taskService = {
  async getTasks(filter: TaskFilter) {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const skip = (page - 1) * limit;

    const query: any = { organizationId: filter.organizationId };
    if (filter.projectId) query.projectId = filter.projectId;
    if (filter.status) query.status = filter.status;
    if (filter.priority) query.priority = filter.priority;
    if (filter.assigneeId) query["assignee.id"] = filter.assigneeId;

    if (filter.search && filter.search.trim().length > 0) {
      const q = filter.search.trim();
      query.$or = [
        { key: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const [tasks, total] = await Promise.all([
      TaskModel.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      TaskModel.countDocuments(query),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getTaskById(organizationId: string, idOrKey: string): Promise<ITaskDocument | null> {
    return TaskModel.findOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });
  },

  async createTask(input: {
    organizationId: string;
    projectId?: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: string;
    tags?: string[];
    branch?: string;
    estimate?: string;
    creatorName: string;
    creatorInitials: string;
  }): Promise<ITaskDocument> {
    // Generate next task key sequence for this organization
    const latestTask = await TaskModel.findOne({ organizationId: input.organizationId })
      .sort({ createdAt: -1 })
      .select("key");

    let nextNum = 881;
    if (latestTask && latestTask.key?.startsWith("NV-")) {
      const parsed = parseInt(latestTask.key.replace("NV-", ""), 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    const taskKey = `NV-${nextNum}`;

    let assignee = {
      id: "unassigned",
      name: "Unassigned",
      avatar: "",
      initials: "--",
    };

    if (input.assigneeId) {
      const member = await TeamMemberModel.findOne({
        organizationId: input.organizationId,
        id: input.assigneeId,
      });
      if (member) {
        assignee = {
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          initials: member.initials,
        };
        await TeamMemberModel.updateOne({ _id: member._id }, { $inc: { activeTasksCount: 1 } });
      }
    }

    const now = new Date().toISOString();
    const task = await TaskModel.create({
      id: `tsk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      key: taskKey,
      organizationId: input.organizationId,
      projectId: input.projectId || "prj-1",
      title: input.title.trim(),
      description: input.description || "",
      status: input.status || "backlog",
      priority: input.priority || "medium",
      assignee,
      tags: input.tags && input.tags.length > 0 ? input.tags : ["General"],
      branch: input.branch,
      estimate: input.estimate || "3 pts",
      createdAt: now,
      updatedAt: now,
    });

    await ActivityItemModel.create({
      id: `act-${Date.now()}`,
      organizationId: input.organizationId,
      type: "task_created",
      actor: { name: input.creatorName, initials: input.creatorInitials },
      action: "created issue",
      target: `${task.key} (${task.title})`,
      timestamp: "Just now",
    });

    broadcastEvent({
      type: "task_created",
      category: "tasks",
      title: "Issue Created",
      message: `${task.key}: ${task.title}`,
      link: "/app/tasks",
      meta: { taskId: task.id, organizationId: input.organizationId },
    });

    return task;
  },

  async updateTask(
    organizationId: string,
    idOrKey: string,
    updates: Partial<{
      title: string;
      description: string;
      status: TaskStatus;
      priority: TaskPriority;
      assigneeId: string;
      tags: string[];
      branch: string;
      estimate: string;
    }>,
    updaterName: string = "System",
    updaterInitials: string = "SY"
  ): Promise<ITaskDocument | null> {
    const task = await TaskModel.findOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });

    if (!task) return null;

    const oldStatus = task.status;
    const now = new Date().toISOString();

    if (updates.title) task.title = updates.title.trim();
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status) task.status = updates.status;
    if (updates.priority) task.priority = updates.priority;
    if (updates.tags) task.tags = updates.tags;
    if (updates.branch !== undefined) task.branch = updates.branch;
    if (updates.estimate !== undefined) task.estimate = updates.estimate;

    if (updates.assigneeId && updates.assigneeId !== task.assignee.id) {
      const member = await TeamMemberModel.findOne({
        organizationId,
        id: updates.assigneeId,
      });
      if (member) {
        task.assignee = {
          id: member.id,
          name: member.name,
          avatar: member.avatar,
          initials: member.initials,
        };
      }
    }

    task.updatedAt = now;
    await task.save();

    // Log status change
    if (updates.status && updates.status !== oldStatus) {
      await ActivityItemModel.create({
        id: `act-${Date.now()}`,
        organizationId,
        type: "task_status",
        actor: { name: updaterName, initials: updaterInitials },
        action: `moved to ${updates.status.replace("_", " ").toUpperCase()}`,
        target: task.key,
        timestamp: "Just now",
      });

      broadcastEvent({
        type: "task_updated",
        category: "tasks",
        title: "Task Status Updated",
        message: `${task.key} moved to ${updates.status.toUpperCase()}`,
        link: "/app/tasks",
        meta: { taskId: task.id, status: updates.status, organizationId },
      });
    }

    return task;
  },

  async deleteTask(organizationId: string, idOrKey: string): Promise<boolean> {
    const result = await TaskModel.deleteOne({
      organizationId,
      $or: [{ id: idOrKey }, { key: idOrKey }],
    });
    return (result.deletedCount || 0) > 0;
  },
};
