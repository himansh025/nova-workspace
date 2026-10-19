import mongoose, { Schema, Document, Model } from "mongoose";

export type GitHubWebhookDeliveryStatus = "RECEIVED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface IGitHubWebhookDeliveryDocument extends Document {
  deliveryId: string;
  organizationId?: string;
  githubInstallationId?: number;
  repositoryFullName?: string;
  event: string;
  status: GitHubWebhookDeliveryStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubWebhookDeliverySchema = new Schema<IGitHubWebhookDeliveryDocument>(
  {
    deliveryId: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, index: true },
    githubInstallationId: { type: Number, index: true },
    repositoryFullName: { type: String },
    event: { type: String, required: true },
    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "RECEIVED",
      index: true,
    },
    error: { type: String },
  },
  { timestamps: true }
);

export const GitHubWebhookDeliveryModel: Model<IGitHubWebhookDeliveryDocument> =
  mongoose.models.GitHubWebhookDelivery ||
  mongoose.model<IGitHubWebhookDeliveryDocument>("GitHubWebhookDelivery", GitHubWebhookDeliverySchema);
