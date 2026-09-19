import mongoose, { Schema, Document, Model } from "mongoose";
import { Spec } from "../services/types";

export interface ISpecDocument extends Omit<Spec, "id">, Document {
  id: string;
  organizationId: string;
  revisionCount: number;
  approvedAt?: Date | null;
  approvedBy?: { id: string; name: string; initials: string } | null;
}

const SpecSchema = new Schema<ISpecDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    key: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
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
    revisionCount: { type: Number, default: 0 },
    approvedAt: { type: Date, default: null },
    approvedBy: {
      id: { type: String },
      name: { type: String },
      initials: { type: String },
    },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  { timestamps: true }
);

SpecSchema.index({ organizationId: 1, status: 1 });

export const SpecModel: Model<ISpecDocument> =
  mongoose.models.Spec || mongoose.model<ISpecDocument>("Spec", SpecSchema);

// ─── SpecRevision ─────────────────────────────────────────────────────────────
// Snapshot of a spec before each save — preserves full revision history
export interface ISpecRevision {
  _id: mongoose.Types.ObjectId;
  specId: string;
  organizationId: string;
  revisionNumber: number;
  title: string;
  content: string;
  summary: string;
  status: string;
  savedBy: { id: string; name: string; initials: string };
  savedAt: Date;
}

export interface ISpecRevisionDocument extends ISpecRevision, Document {}

const SpecRevisionSchema = new Schema<ISpecRevisionDocument>({
  specId: { type: String, required: true, index: true },
  organizationId: { type: String, required: true, index: true },
  revisionNumber: { type: Number, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  summary: { type: String, default: "" },
  status: { type: String, required: true },
  savedBy: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    initials: { type: String, required: true },
  },
  savedAt: { type: Date, default: () => new Date() },
});

SpecRevisionSchema.index({ specId: 1, revisionNumber: -1 });

export const SpecRevisionModel: Model<ISpecRevisionDocument> =
  mongoose.models.SpecRevision ||
  mongoose.model<ISpecRevisionDocument>("SpecRevision", SpecRevisionSchema);
