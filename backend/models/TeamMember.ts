import mongoose, { Schema, Document, Model } from "mongoose";
import { TeamMember } from "../services/types";

export interface ITeamMemberDocument extends Omit<TeamMember, "id">, Document {
  id: string;
  organizationId: string;
}

const TeamMemberSchema = new Schema<ITeamMemberDocument>(
  {
    id: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true, lowercase: true },
    role: { type: String, required: true },
    avatar: { type: String, default: "" },
    initials: { type: String, required: true },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "online",
    },
    activeTasksCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

TeamMemberSchema.index({ organizationId: 1, id: 1 }, { unique: true });
TeamMemberSchema.index({ organizationId: 1, email: 1 });

export const TeamMemberModel: Model<ITeamMemberDocument> =
  mongoose.models.TeamMember || mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);
