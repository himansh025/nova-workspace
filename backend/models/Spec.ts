import mongoose, { Schema, Document, Model } from "mongoose";
import { Spec } from "../services/types";

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

export const SpecModel: Model<ISpecDocument> =
  mongoose.models.Spec || mongoose.model<ISpecDocument>("Spec", SpecSchema);
