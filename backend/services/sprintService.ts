import { SprintModel, ISprintDocument } from "../models/Sprint";
import { TaskModel } from "../models/Task";
import { ActivityItemModel } from "../models/Activity";
import { broadcastEvent } from "./events";

export const sprintService = {
  async getSprints(organizationId: string): Promise<ISprintDocument[]> {
    return SprintModel.find({ organizationId }).sort({ createdAt: -1 });
  },

  async getActiveSprint(organizationId: string): Promise<ISprintDocument | null> {
    const active = await SprintModel.findOne({ organizationId, status: "active" });
    if (active) return active;
    return SprintModel.findOne({ organizationId }).sort({ createdAt: -1 });
  },

  async getSprintById(organizationId: string, id: string): Promise<ISprintDocument | null> {
    return SprintModel.findOne({ organizationId, id });
  },

  async createSprint(input: {
    organizationId: string;
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
    totalDays?: number;
  }): Promise<ISprintDocument> {
    const sprintId = `spr-${Date.now().toString(36)}`;
    const sprint = await SprintModel.create({
      id: sprintId,
      organizationId: input.organizationId,
      name: input.name,
      goal: input.goal || "",
      status: "planned",
      startDate: input.startDate,
      endDate: input.endDate,
      totalDays: input.totalDays || 14,
      currentDay: 1,
      totalPoints: 0,
      completedPoints: 0,
      remainingPoints: 0,
      taskIds: [],
      burndown: [],
      pokerVotes: [],
    });

    return sprint;
  },

  async castPokerVote(
    organizationId: string,
    taskId: string,
    voter: string,
    points: number
  ) {
    const sprint = await SprintModel.findOne({ organizationId, status: "active" });

    // Update task estimate
    await TaskModel.updateOne(
      { organizationId, $or: [{ id: taskId }, { key: taskId }] },
      { $set: { estimate: `${points} pts` } }
    );

    if (sprint) {
      if (!sprint.pokerVotes) sprint.pokerVotes = [];
      sprint.pokerVotes = sprint.pokerVotes.filter((v) => !(v.taskId === taskId && v.voter === voter));
      sprint.pokerVotes.push({
        taskId,
        voter,
        points,
        timestamp: new Date().toISOString(),
      });
      await sprint.save();
      await this.recalculateSprintPoints(organizationId, sprint.id);
    }

    broadcastEvent({
      type: "task_updated",
      category: "tasks",
      title: "Poker Estimate Updated",
      message: `${voter} voted ${points} pts for task`,
      link: "/app/sprints",
      meta: { taskId, points, organizationId },
    });

    return { taskId, voter, points };
  },

  async assignTaskToSprint(organizationId: string, taskId: string, targetSprintId: string | null) {
    // Remove from all sprints in org
    await SprintModel.updateMany(
      { organizationId },
      { $pull: { taskIds: taskId } }
    );

    if (targetSprintId) {
      await SprintModel.updateOne(
        { organizationId, id: targetSprintId },
        { $addToSet: { taskIds: taskId } }
      );
      await this.recalculateSprintPoints(organizationId, targetSprintId);
    }

    return this.getActiveSprint(organizationId);
  },

  async startSprint(organizationId: string, sprintId: string): Promise<ISprintDocument | null> {
    // Put any currently active sprint to planned
    await SprintModel.updateMany(
      { organizationId, status: "active", id: { $ne: sprintId } },
      { $set: { status: "planned" } }
    );

    const sprint = await SprintModel.findOneAndUpdate(
      { organizationId, id: sprintId },
      { $set: { status: "active", currentDay: 1 } },
      { returnDocument: "after" }
    );

    if (sprint) {
      await this.recalculateSprintPoints(organizationId, sprintId);
      broadcastEvent({
        type: "system",
        category: "system",
        title: "Sprint Started",
        message: `${sprint.name} has officially kicked off!`,
        link: "/app/sprints",
      });
    }

    return sprint;
  },

  async completeSprint(organizationId: string, sprintId: string, rolloverTargetId?: string) {
    const sprint = await SprintModel.findOne({ organizationId, id: sprintId });
    if (!sprint) throw new Error("Sprint not found");

    sprint.status = "completed";

    // Find tasks in this sprint
    const tasks = await TaskModel.find({ organizationId, id: { $in: sprint.taskIds } });
    const doneTasks = tasks.filter((t) => t.status === "done");
    const incompleteTasks = tasks.filter((t) => t.status !== "done");

    let completedPts = 0;
    doneTasks.forEach((t) => {
      const pts = parseInt(t.estimate?.replace(/\D/g, "") || "0", 10) || 3;
      completedPts += pts;
    });

    sprint.completedPoints = completedPts;
    sprint.remainingPoints = Math.max(0, sprint.totalPoints - completedPts);
    await sprint.save();

    let rolledOverCount = 0;
    if (rolloverTargetId && incompleteTasks.length > 0) {
      const incompleteIds = incompleteTasks.map((t) => t.id);
      await SprintModel.updateOne(
        { organizationId, id: rolloverTargetId },
        { $addToSet: { taskIds: { $each: incompleteIds } } }
      );
      rolledOverCount = incompleteIds.length;
      await this.recalculateSprintPoints(organizationId, rolloverTargetId);
    }

    // Auto-activate next planned sprint
    const nextPlanned = await SprintModel.findOne({ organizationId, status: "planned" }).sort({ createdAt: 1 });
    if (nextPlanned) {
      nextPlanned.status = "active";
      await nextPlanned.save();
    }

    await ActivityItemModel.create({
      id: `act-${Date.now()}`,
      organizationId,
      type: "release",
      actor: { name: "Sprint Engine", initials: "SE" },
      action: "completed sprint cycle",
      target: sprint.name,
      timestamp: "Just now",
    });

    return { completedSprint: sprint, rolledOverCount };
  },

  async recalculateSprintPoints(organizationId: string, sprintId: string) {
    const sprint = await SprintModel.findOne({ organizationId, id: sprintId });
    if (!sprint || sprint.status === "completed") return;

    const tasks = await TaskModel.find({ organizationId, id: { $in: sprint.taskIds } });
    let total = 0;
    let completed = 0;

    tasks.forEach((t) => {
      const pts = parseInt(t.estimate?.replace(/\D/g, "") || "0", 10) || 3;
      total += pts;
      if (t.status === "done") completed += pts;
    });

    sprint.totalPoints = total;
    sprint.completedPoints = completed;
    sprint.remainingPoints = Math.max(0, total - completed);
    await sprint.save();
  },
};
