import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Notification ─────────────────────────────────────────────────────────────
export interface INotification {
  _id: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  organizationId: string;
  type: string;             // e.g. "task_assigned", "pr_merged", "spec_approved"
  title: string;
  body: string;
  entityType?: string;      // e.g. "task", "spec", "pr"
  entityId?: string;
  link?: string;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    entityType: { type: String },
    entityId: { type: String },
    link: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Index for unread count queries
NotificationSchema.index({ userId: 1, readAt: 1 });
NotificationSchema.index({ userId: 1, organizationId: 1, createdAt: -1 });

export const NotificationModel: Model<INotificationDocument> =
  mongoose.models.Notification ||
  mongoose.model<INotificationDocument>("Notification", NotificationSchema);
