import mongoose, { Schema, Document, Model } from "mongoose";
import { Task, Spec, Project, Release, TeamMember, ActivityItem } from "../server/types";

// ---------------------------------------------------------------------------
// Task Schema & Model
// ---------------------------------------------------------------------------
export interface ITaskDocument extends Omit<Task, "id">, Document {
  id: string;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["backlog", "in_progress", "review", "done"],
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

// ---------------------------------------------------------------------------
// Spec Schema & Model
// ---------------------------------------------------------------------------
export interface ISpecDocument extends Omit<Spec, "id">, Document {
  id: string;
}

const SpecSchema = new Schema<ISpecDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    content: { type: String, default: "" },
    status: {
      type: String,
      enum: ["drafting", "review", "approved"],
      default: "drafting",
      index: true,
    },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      initials: { type: String, required: true },
    },
    tags: [{ type: String }],
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Project Schema & Model
// ---------------------------------------------------------------------------
export interface IProjectDocument extends Omit<Project, "id">, Document {
  id: string;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
    sprint: { type: String, default: "Sprint 42" },
    progressPercent: { type: Number, default: 0 },
    cycleTime: { type: String, default: "1.4d" },
    velocity: { type: String, default: "48 pts" },
    activeBranch: { type: String, default: "main" },
    repository: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Release Schema & Model
// ---------------------------------------------------------------------------
export interface IReleaseDocument extends Omit<Release, "id">, Document {
  id: string;
}

const ReleaseSchema = new Schema<IReleaseDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    version: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "canary", "released"],
      default: "draft",
    },
    canaryPercentage: { type: Number, default: 0 },
    checksPassed: { type: Number, default: 0 },
    totalChecks: { type: Number, default: 5 },
    checks: [
      {
        id: { type: String },
        name: { type: String },
        category: { type: String },
        status: { type: String },
        duration: { type: String },
        details: { type: String },
      },
    ],
    changelog: [{ type: String }],
    releasedAt: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Team Member Schema & Model
// ---------------------------------------------------------------------------
export interface ITeamMemberDocument extends Omit<TeamMember, "id">, Document {
  id: string;
}

const TeamMemberSchema = new Schema<ITeamMemberDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: { type: String, required: true },
    avatar: { type: String, default: "" },
    initials: { type: String, required: true },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "online",
    },
    activeTasksCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Activity Item Schema & Model
// ---------------------------------------------------------------------------
export interface IActivityItemDocument extends Omit<ActivityItem, "id">, Document {
  id: string;
}

const ActivityItemSchema = new Schema<IActivityItemDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ["task_status", "task_created", "spec_approved", "commit", "release", "member_joined"],
      required: true,
    },
    actor: {
      name: { type: String, required: true },
      initials: { type: String, required: true },
    },
    action: { type: String, required: true },
    target: { type: String, required: true },
    timestamp: { type: String, required: true },
  },
  { timestamps: true }
);

export const TaskModel: Model<ITaskDocument> =
  mongoose.models.Task || mongoose.model<ITaskDocument>("Task", TaskSchema);

export const SpecModel: Model<ISpecDocument> =
  mongoose.models.Spec || mongoose.model<ISpecDocument>("Spec", SpecSchema);

export const ProjectModel: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);

export const ReleaseModel: Model<IReleaseDocument> =
  mongoose.models.Release || mongoose.model<IReleaseDocument>("Release", ReleaseSchema);

export const TeamMemberModel: Model<ITeamMemberDocument> =
  mongoose.models.TeamMember || mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);

export const ActivityItemModel: Model<IActivityItemDocument> =
  mongoose.models.ActivityItem || mongoose.model<IActivityItemDocument>("ActivityItem", ActivityItemSchema);
