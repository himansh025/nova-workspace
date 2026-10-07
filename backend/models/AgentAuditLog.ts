import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgentAuditLog {
  id: string;
  agentRunId: string;
  organizationId: string;
  userId: string;
  tool: string;
  path?: string;
  inputSummary: string;
  outputSummary: string;
  createdAt: Date;
}

export interface IAgentAuditLogDocument extends Document, IAgentAuditLog {}

const AgentAuditLogSchema = new Schema<IAgentAuditLogDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    agentRunId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    tool: { type: String, required: true },
    path: { type: String },
    inputSummary: { type: String, default: "" },
    outputSummary: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AgentAuditLogSchema.index({ agentRunId: 1, createdAt: -1 });

export const AgentAuditLogModel: Model<IAgentAuditLogDocument> =
  mongoose.models.AgentAuditLog ||
  mongoose.model<IAgentAuditLogDocument>("AgentAuditLog", AgentAuditLogSchema);
