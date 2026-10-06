import mongoose, { Schema, Document, Model } from "mongoose";

export type GitHubInstallationStatus = "ACTIVE" | "SUSPENDED" | "REVOKED" | "PENDING";

export interface IGitHubInstallationDocument extends Document {
  id: string;
  organizationId: string;
  githubInstallationId: number;
  githubAccountId?: string;
  accountLogin?: string;
  accountType?: string;
  status: GitHubInstallationStatus;
  permissions: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubInstallationSchema = new Schema<IGitHubInstallationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    githubInstallationId: { type: Number, required: true, unique: true, index: true },
    githubAccountId: { type: String, index: true },
    accountLogin: { type: String, default: "" },
    accountType: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "REVOKED", "PENDING"],
      default: "PENDING",
      index: true,
    },
    permissions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

GitHubInstallationSchema.index({ organizationId: 1, status: 1 });

export const GitHubInstallationModel: Model<IGitHubInstallationDocument> =
  mongoose.models.GitHubInstallation ||
  mongoose.model<IGitHubInstallationDocument>("GitHubInstallation", GitHubInstallationSchema);
