import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIntegrationSettings {
  _id: mongoose.Types.ObjectId;
  organizationId: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    encryptedPass: string;
    from: string;
    enabled: boolean;
    lastTestedAt?: Date;
    testStatus?: "passed" | "failed";
  };
  github?: {
    clientId: string;
    encryptedClientSecret: string;
    encryptedWebhookSecret?: string;
    repository?: string;
    enabled: boolean;
    lastTestedAt?: Date;
    testStatus?: "passed" | "failed";
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IIntegrationSettingsDocument extends IIntegrationSettings, Document {}

const IntegrationSettingsSchema = new Schema<IIntegrationSettingsDocument>(
  {
    organizationId: { type: String, required: true, unique: true, index: true },
    smtp: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      encryptedPass: { type: String, default: "" },
      from: { type: String, default: "noreply@nova.app" },
      enabled: { type: Boolean, default: false },
      lastTestedAt: { type: Date },
      testStatus: { type: String, enum: ["passed", "failed"] },
    },
    github: {
      clientId: { type: String, default: "" },
      encryptedClientSecret: { type: String, default: "" },
      encryptedWebhookSecret: { type: String, default: "" },
      repository: { type: String, default: "" },
      enabled: { type: Boolean, default: false },
      lastTestedAt: { type: Date },
      testStatus: { type: String, enum: ["passed", "failed"] },
    },
  },
  { timestamps: true }
);

export const IntegrationSettingsModel: Model<IIntegrationSettingsDocument> =
  mongoose.models.IntegrationSettings ||
  mongoose.model<IIntegrationSettingsDocument>("IntegrationSettings", IntegrationSettingsSchema);
