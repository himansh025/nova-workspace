import mongoose, { Schema, Document, Model } from "mongoose";
import { Release, PreflightCheck } from "../services/types";

export interface IReleaseDocument extends Omit<Release, "id">, Document {
  id: string;
  organizationId: string;
}

const PreflightCheckSchema = new Schema<PreflightCheck>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["test", "security", "database", "build", "e2e"],
      required: true,
    },
    status: {
      type: String,
      enum: ["passed", "running", "failed", "pending"],
      default: "pending",
    },
    duration: { type: String, default: "0ms" },
    details: { type: String, default: "" },
  },
  { _id: false }
);

const ReleaseSchema = new Schema<IReleaseDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    version: { type: String, required: true },
    projectId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "canary", "released"],
      default: "draft",
    },
    canaryPercentage: { type: Number, default: 0 },
    checksPassed: { type: Number, default: 0 },
    totalChecks: { type: Number, default: 0 },
    checks: [PreflightCheckSchema],
    changelog: [{ type: String }],
    releasedAt: { type: String },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

ReleaseSchema.index({ organizationId: 1, projectId: 1, createdAt: -1 });

export const ReleaseModel: Model<IReleaseDocument> =
  mongoose.models.Release || mongoose.model<IReleaseDocument>("Release", ReleaseSchema);
