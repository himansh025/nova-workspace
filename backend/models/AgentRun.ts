import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  AgentRunStatus,
  AgentLoopPhase,
  AgentEditMode,
  IPlanStep,
  IAgentTokenUsage,
  IAgentDiffSummary,
} from "../services/ai/agent/agentTypes";

export interface IAgentRun {
  id: string;
  organizationId: string;
  userId: string;
  repositoryId: string;
  branch?: string;
  task: string;
  status: AgentRunStatus;
  currentStep?: string;
  plan: IPlanStep[];
  discoveredFiles: string[];
  relevantFiles: string[];
  modifiedFiles: string[];
  iterationCount: number;
  tokenUsage: IAgentTokenUsage;
  enableEdits: boolean;
  editMode: AgentEditMode;
  workspaceInitialized: boolean;
  loopPhase?: AgentLoopPhase;
  waitingForProposalId?: string;
  diffSummary?: IAgentDiffSummary;
  finalResult?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentRunDocument extends Document {
  id: string;
  organizationId: string;
  userId: string;
  repositoryId: string;
  branch?: string;
  task: string;
  status: AgentRunStatus;
  currentStep?: string;
  plan: IPlanStep[];
  discoveredFiles: string[];
  relevantFiles: string[];
  modifiedFiles: string[];
  iterationCount: number;
  tokenUsage: IAgentTokenUsage;
  enableEdits: boolean;
  editMode: AgentEditMode;
  workspaceInitialized: boolean;
  loopPhase?: AgentLoopPhase;
  waitingForProposalId?: string;
  diffSummary?: IAgentDiffSummary;
  finalResult?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DiffSummarySchema = new Schema(
  {
    filesAdded: { type: Number, default: 0 },
    filesModified: { type: Number, default: 0 },
    filesDeleted: { type: Number, default: 0 },
    linesAdded: { type: Number, default: 0 },
    linesRemoved: { type: Number, default: 0 },
  },
  { _id: false }
);

const PlanStepSchema = new Schema(
  {
    id: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    relevantFiles: { type: [String], default: [] },
    reason: { type: String },
    result: { type: String },
  },
  { _id: false }
);

const TokenUsageSchema = new Schema(
  {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    toolCalls: { type: Number, default: 0 },
    iterations: { type: Number, default: 0 },
  },
  { _id: false }
);

const AgentRunSchema = new Schema<IAgentRunDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    repositoryId: { type: String, required: true, index: true },
    branch: { type: String },
    task: { type: String, required: true },
    status: {
      type: String,
      enum: ["PLANNING", "ANALYZING", "WAITING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PLANNING",
    },
    currentStep: { type: String },
    plan: { type: [PlanStepSchema], default: [] },
    discoveredFiles: { type: [String], default: [] },
    relevantFiles: { type: [String], default: [] },
    modifiedFiles: { type: [String], default: [] },
    iterationCount: { type: Number, default: 0 },
    tokenUsage: { type: TokenUsageSchema, default: () => ({}) },
    enableEdits: { type: Boolean, default: true },
    editMode: { type: String, enum: ["approval", "autonomous"], default: "approval" },
    workspaceInitialized: { type: Boolean, default: false },
    loopPhase: {
      type: String,
      enum: ["PLAN", "SEARCH", "READ", "EDIT", "DIFF", "REVIEW"],
    },
    waitingForProposalId: { type: String },
    diffSummary: { type: DiffSummarySchema },
    finalResult: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

AgentRunSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
AgentRunSchema.index({ organizationId: 1, repositoryId: 1, status: 1 });

export const AgentRunModel: Model<IAgentRunDocument> =
  mongoose.models.AgentRun || mongoose.model<IAgentRunDocument>("AgentRun", AgentRunSchema);
