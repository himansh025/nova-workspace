import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRepositoryDocument extends Document {
  id: string;
  organizationId: string;
  githubInstallationId: number;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  selectedBranch?: string;
  htmlUrl: string;
  archived: boolean;
  selected: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepositoryDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    githubInstallationId: { type: Number, required: true, index: true },
    githubRepositoryId: { type: Number, required: true, index: true },
    owner: { type: String, required: true },
    name: { type: String, required: true },
    fullName: { type: String, required: true, index: true },
    private: { type: Boolean, default: false },
    defaultBranch: { type: String, default: "main" },
    selectedBranch: { type: String },
    htmlUrl: { type: String, default: "" },
    archived: { type: Boolean, default: false },
    selected: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

RepositorySchema.index({ organizationId: 1, githubInstallationId: 1, githubRepositoryId: 1 }, { unique: true });
RepositorySchema.index({ organizationId: 1, selected: 1 });

export const RepositoryModel: Model<IRepositoryDocument> =
  mongoose.models.Repository ||
  mongoose.model<IRepositoryDocument>("Repository", RepositorySchema);
