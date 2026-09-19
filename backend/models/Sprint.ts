import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISprintDayBurndown {
  day: number;
  date: string;
  idealRemaining: number;
  actualRemaining: number | null;
}

export interface IPokerVote {
  taskId: string;
  voter: string;
  points: number;
  timestamp: string;
}

export interface ISprint {
  id: string;
  name: string;
  goal: string;
  status: "active" | "planned" | "completed";
  startDate: string;
  endDate: string;
  totalDays: number;
  currentDay: number;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  taskIds: string[];
  burndown: ISprintDayBurndown[];
  pokerVotes?: IPokerVote[];
}

export interface ISprintDocument extends Omit<ISprint, "id">, Document {
  id: string;
}

const SprintSchema = new Schema<ISprintDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    goal: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "planned", "completed"],
      default: "planned",
      index: true,
    },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    totalDays: { type: Number, default: 14 },
    currentDay: { type: Number, default: 1 },
    totalPoints: { type: Number, default: 40 },
    completedPoints: { type: Number, default: 0 },
    remainingPoints: { type: Number, default: 40 },
    taskIds: [{ type: String }],
    burndown: [
      {
        day: { type: Number },
        date: { type: String },
        idealRemaining: { type: Number },
        actualRemaining: { type: Number, default: null },
      },
    ],
    pokerVotes: [
      {
        taskId: { type: String },
        voter: { type: String },
        points: { type: Number },
        timestamp: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const SprintModel: Model<ISprintDocument> =
  mongoose.models.Sprint || mongoose.model<ISprintDocument>("Sprint", SprintSchema);
