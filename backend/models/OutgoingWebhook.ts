import mongoose, { Schema, Document } from "mongoose";

export interface IOutgoingWebhookDoc extends Document {
  id: string;
  organizationId: string;
  name: string;
  target: "slack" | "discord" | "custom";
  url: string;
  events: string[];
  status: "active" | "paused";
  lastDelivery?: string;
  deliverySuccessRate: number;
  secret?: string;
}

const OutgoingWebhookSchema = new Schema<IOutgoingWebhookDoc>(
  {
    id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    target: { type: String, enum: ["slack", "discord", "custom"], default: "custom" },
    url: { type: String, required: true },
    events: [{ type: String }],
    status: { type: String, enum: ["active", "paused"], default: "active" },
    lastDelivery: { type: String },
    deliverySuccessRate: { type: Number, default: 100 },
    secret: { type: String },
  },
  {
    timestamps: true,
  }
);

OutgoingWebhookSchema.index({ organizationId: 1, id: 1 }, { unique: true });

export const OutgoingWebhookModel =
  mongoose.models.OutgoingWebhook ||
  mongoose.model<IOutgoingWebhookDoc>("OutgoingWebhook", OutgoingWebhookSchema);
