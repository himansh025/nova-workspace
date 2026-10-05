import mongoose, { Schema, Document, Model } from "mongoose";
import { Task } from "../services/types";

export interface ITaskDocument extends Omit<Task, "id">, Document {
  id: string;
  organizationId: string;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["backlog", "todo", "in_progress", "review", "done"],
      default: "backlog",
      index: true,
    },
    priority: {
      type: String,
      enum: ["urgent", "high", "medium", "low"],
      default: "medium",
      index: true,
    },
    assignee: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, default: "" },
      initials: { type: String, required: true },
    },
    tags: [{ type: String }],
    branch: { type: String },
    estimate: { type: String, default: "3 pts" },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// Compound index for org-scoped queries
TaskSchema.index({ organizationId: 1, projectId: 1, status: 1 });
TaskSchema.index({ organizationId: 1, updatedAt: -1 });

export const TaskModel: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);
