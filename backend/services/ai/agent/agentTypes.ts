export type AgentRunStatus =
  | "PLANNING"
  | "ANALYZING"
  | "WAITING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type AgentLoopPhase =
  | "PLAN"
  | "SEARCH"
  | "READ"
  | "EDIT"
  | "DIFF"
  | "REVIEW"
  | "TEST"
  | "VERIFY"
  | "GIT";

export type GitWorkflowStatus = "idle" | "branch_created" | "committed" | "failed";

export type VerificationStatus = "not_run" | "passed" | "failed";

export type AgentEditMode = "approval" | "autonomous";

export interface IAgentDiffSummary {
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  linesAdded: number;
  linesRemoved: number;
}

export type PlanStepStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface IPlanStep {
  id: string;
  description: string;
  status: PlanStepStatus;
  relevantFiles: string[];
  reason?: string;
  result?: string;
}

export interface IAgentTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: number;
  iterations: number;
}

export interface IAgentToolContext {
  organizationId: string;
  userId: string;
  repositoryId: string;
  branch: string;
  runId?: string;
  autonomousMode?: boolean;
  enableEdits?: boolean;
  enableVerification?: boolean;
  enableGitWorkflow?: boolean;
}

export interface IAgentLastExecution {
  tool: string;
  command: string;
  exitCode: number;
  success: boolean;
  durationMs: number;
  errorSummary: string;
  sandbox: string;
}

export interface IAgentToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  authorize: (ctx: IAgentToolContext) => void | Promise<void>;
  execute: (ctx: IAgentToolContext, input: Record<string, unknown>) => Promise<unknown>;
  maxOutputChars: number;
}

export interface IAgentDecision {
  action: "tool" | "complete_step" | "finish";
  toolName?: string;
  toolInput?: Record<string, unknown>;
  stepId?: string;
  stepResult?: string;
  finalSummary?: string;
  reason?: string;
}

export interface IPlanningResult {
  steps: Array<{
    description: string;
    relevantFiles?: string[];
    reason?: string;
  }>;
}
