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
    sprint: { type: String, default: "Sprint 24" },
    progressPercent: { type: Number, default: 0 },
    cycleTime: { type: String, default: "1.4d" },
    velocity: { type: String, default: "38 pts" },
    activeBranch: { type: String, default: "main" },
    repository: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export const ProjectModel: Model<IProjectDocument> =
  mongoose.models.Project || mongoose.model<IProjectDocument>("Project", ProjectSchema);
