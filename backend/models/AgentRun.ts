import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  AgentRunStatus,
  AgentLoopPhase,
  AgentEditMode,
  VerificationStatus,
  GitWorkflowStatus,
  AgentPublishMode,
  PublishStatus,
  IAgentLastExecution,
  IPlanStep,
  IAgentTokenUsage,
  IAgentDiffSummary,
  IAgentTokenBudget,
  IAgentContextOptimization,
  IAgentRunLimits,
  TaskComplexity,
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
  enableVerification: boolean;
  verificationStatus: VerificationStatus;
  lastExecution?: IAgentLastExecution;
  selfFixIterationCount: number;
  enableGitWorkflow: boolean;
  gitWorkflowStatus: GitWorkflowStatus;
  gitBranch?: string;
  gitCommitSha?: string;
  gitError?: string;
  enableGithubPublish: boolean;
  publishMode: AgentPublishMode;
  publishStatus: PublishStatus;
  githubPushSha?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  publishError?: string;
  tokenBudget?: IAgentTokenBudget;
  contextOptimization?: IAgentContextOptimization;
  limits: IAgentRunLimits;
  taskComplexity?: TaskComplexity;
  stopReason?: string;
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
  enableVerification: boolean;
  verificationStatus: VerificationStatus;
  lastExecution?: IAgentLastExecution;
  selfFixIterationCount: number;
  enableGitWorkflow: boolean;
  gitWorkflowStatus: GitWorkflowStatus;
  gitBranch?: string;
  gitCommitSha?: string;
  gitError?: string;
  enableGithubPublish: boolean;
  publishMode: AgentPublishMode;
  publishStatus: PublishStatus;
  githubPushSha?: string;
  pullRequestNumber?: number;
  pullRequestUrl?: string;
  publishError?: string;
  tokenBudget?: IAgentTokenBudget;
  contextOptimization?: IAgentContextOptimization;
  limits: IAgentRunLimits;
  taskComplexity?: TaskComplexity;
  stopReason?: string;
  finalResult?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TokenBudgetSchema = new Schema(
  {
    planning: { type: Number, default: 0 },
    decision: { type: Number, default: 0 },
    tools: { type: Number, default: 0 },
    final: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const RunLimitsSchema = new Schema(
  {
    maxInputTokens: { type: Number, required: true },
    maxOutputTokens: { type: Number, required: true },
    maxIterations: { type: Number, required: true },
    maxToolCalls: { type: Number, required: true },
    maxExecutionTimeMs: { type: Number, required: true },
  },
  { _id: false }
);

const ContextOptimizationSchema = new Schema(
  {
    sentFilePaths: { type: [String], default: [] },
    toolResultHashes: { type: [String], default: [] },
    contentKeys: { type: [String], default: [] },
    stateSummary: { type: String },
  },
  { _id: false }
);

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
      enum: ["PLAN", "SEARCH", "READ", "EDIT", "DIFF", "REVIEW", "TEST", "VERIFY", "GIT", "PUBLISH"],
    },
    waitingForProposalId: { type: String },
    diffSummary: { type: DiffSummarySchema },
    enableVerification: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: ["not_run", "passed", "failed"],
      default: "not_run",
    },
    lastExecution: {
      type: {
        tool: String,
        command: String,
        exitCode: Number,
        success: Boolean,
        durationMs: Number,
        errorSummary: String,
        sandbox: String,
      },
      _id: false,
    },
    selfFixIterationCount: { type: Number, default: 0 },
    enableGitWorkflow: { type: Boolean, default: true },
    gitWorkflowStatus: {
      type: String,
      enum: ["idle", "branch_created", "committed", "failed"],
      default: "idle",
    },
    gitBranch: { type: String },
    gitCommitSha: { type: String },
    gitError: { type: String },
    enableGithubPublish: { type: Boolean, default: true },
    publishMode: { type: String, enum: ["pr", "push_only"], default: "pr" },
    publishStatus: {
      type: String,
      enum: ["idle", "pushed", "pr_created", "failed"],
      default: "idle",
    },
    githubPushSha: { type: String },
    pullRequestNumber: { type: Number },
    pullRequestUrl: { type: String },
    publishError: { type: String },
    tokenBudget: { type: TokenBudgetSchema },
    contextOptimization: { type: ContextOptimizationSchema },
    limits: { type: RunLimitsSchema, required: true },
    taskComplexity: { type: String, enum: ["simple", "complex"] },
    stopReason: { type: String },
    finalResult: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

AgentRunSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
AgentRunSchema.index({ organizationId: 1, repositoryId: 1, status: 1 });

export const AgentRunModel: Model<IAgentRunDocument> =
  mongoose.models.AgentRun || mongoose.model<IAgentRunDocument>("AgentRun", AgentRunSchema);
