import mongoose, { Schema, Document, Model } from "mongoose";
import { ActivityItem } from "../services/types";

export interface IActivityItemDocument extends Omit<ActivityItem, "id">, Document {
  id: string;
  organizationId: string;
}

const ActivityItemSchema = new Schema<IActivityItemDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
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
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivityItemSchema.index({ organizationId: 1, createdAt: -1 });

export const ActivityItemModel: Model<IActivityItemDocument> =
  mongoose.models.ActivityItem || mongoose.model<IActivityItemDocument>("ActivityItem", ActivityItemSchema);
