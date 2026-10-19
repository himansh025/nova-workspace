import mongoose, { Schema, Document, Model } from "mongoose";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED" | "APPLIED" | "CANCELLED";
export type ProposalTool = "write_file" | "apply_patch" | "delete_file" | "rename_file";

export interface IAgentChangeProposal {
  id: string;
  agentRunId: string;
  organizationId: string;
  userId: string;
  tool: ProposalTool;
  path: string;
  targetPath?: string;
  payload: Record<string, unknown>;
  status: ProposalStatus;
  linesAdded: number;
  linesRemoved: number;
  diffPreview: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentChangeProposalDocument extends Document, IAgentChangeProposal {}

const AgentChangeProposalSchema = new Schema<IAgentChangeProposalDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    agentRunId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    tool: {
      type: String,
      enum: ["write_file", "apply_patch", "delete_file", "rename_file"],
      required: true,
    },
    path: { type: String, required: true },
    targetPath: { type: String },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "APPLIED", "CANCELLED"],
      default: "PENDING",
    },
    linesAdded: { type: Number, default: 0 },
    linesRemoved: { type: Number, default: 0 },
    diffPreview: { type: String, default: "" },
  },
  { timestamps: true }
);

AgentChangeProposalSchema.index({ agentRunId: 1, status: 1 });

export const AgentChangeProposalModel: Model<IAgentChangeProposalDocument> =
  mongoose.models.AgentChangeProposal ||
  mongoose.model<IAgentChangeProposalDocument>("AgentChangeProposal", AgentChangeProposalSchema);
