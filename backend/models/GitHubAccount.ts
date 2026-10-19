import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGitHubAccountDocument extends Document {
  id: string;
  userId: string;
  githubUserId: number;
  login: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const GitHubAccountSchema = new Schema<IGitHubAccountDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    githubUserId: { type: Number, required: true, index: true },
    login: { type: String, required: true },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

GitHubAccountSchema.index({ userId: 1, githubUserId: 1 }, { unique: true });

export const GitHubAccountModel: Model<IGitHubAccountDocument> =
  mongoose.models.GitHubAccount ||
  mongoose.model<IGitHubAccountDocument>("GitHubAccount", GitHubAccountSchema);
