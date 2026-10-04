import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITeamGroupDocument extends Document {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeamGroupSchema = new Schema<ITeamGroupDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const TeamGroupModel: Model<ITeamGroupDocument> =
  mongoose.models.TeamGroup || mongoose.model<ITeamGroupDocument>("TeamGroup", TeamGroupSchema);
