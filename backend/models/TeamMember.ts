import mongoose, { Schema, Document, Model } from "mongoose";
import { TeamMember } from "../services/types";

export interface ITeamMemberDocument extends Omit<TeamMember, "id">, Document {
  id: string;
}

const TeamMemberSchema = new Schema<ITeamMemberDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
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

export const TeamMemberModel: Model<ITeamMemberDocument> =
  mongoose.models.TeamMember || mongoose.model<ITeamMemberDocument>("TeamMember", TeamMemberSchema);
