import mongoose, { Schema, Document, Model } from "mongoose";
import { Project } from "../services/types";

export interface IProjectDocument extends Omit<Project, "id">, Document {
  id: string;
  organizationId: string;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    sprint: { type: String, default: "Sprint 1" },
    progressPercent: { type: Number, default: 0 },
    cycleTime: { type: String, default: "--" },
    velocity: { type: String, default: "0 pts" },
    activeBranch: { type: String, default: "main" },
    repository: { type: String, required: true },
    teamGroupId: { type: String, default: null },
    isDefaultForTasks: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const ProjectModel: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);
