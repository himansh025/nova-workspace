import { agentOrchestrator } from "./ai/agent/agentOrchestrator";
import { githubRepositoryExplorerService } from "./githubRepositoryExplorerService";

export const agentService = {
  async createRun(
    organizationId: string,
    userId: string,
    params: { repositoryId: string; task: string; branch?: string; model?: string }
  ) {
    if (!params.task || !params.task.trim()) {
      const err = new Error("Task is required.") as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }
    if (!params.repositoryId) {
      const err = new Error("repositoryId is required.") as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    await githubRepositoryExplorerService.verifyAndGetRepository(
      organizationId,
      params.repositoryId
    );

    const run = await agentOrchestrator.startRun({
      organizationId,
      userId,
      repositoryId: params.repositoryId,
      task: params.task.trim(),
      branch: params.branch,
      model: params.model,
    });

    return this.toSafeRun(run);
  },

  async getRun(organizationId: string, userId: string, runId: string) {
    const run = await agentOrchestrator.getRun(organizationId, userId, runId);
    if (!run) {
      const err = new Error("Agent run not found.") as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    return this.toSafeRun(run);
  },

  async getPlan(organizationId: string, userId: string, runId: string) {
    const run = await this.getRun(organizationId, userId, runId);
    return { runId: run.id, plan: run.plan, currentStep: run.currentStep, status: run.status };
  },

  async cancelRun(organizationId: string, userId: string, runId: string) {
    const ok = await agentOrchestrator.cancelRun(organizationId, userId, runId);
    if (!ok) {
      const err = new Error("Agent run not found.") as Error & { statusCode?: number };
      err.statusCode = 404;
      throw err;
    }
    return this.getRun(organizationId, userId, runId);
  },

  toSafeRun(run: {
    id: string;
    organizationId: string;
    userId: string;
    repositoryId: string;
    branch?: string;
    task: string;
    status: string;
    currentStep?: string;
    plan: unknown[];
    discoveredFiles: string[];
    relevantFiles: string[];
    modifiedFiles: string[];
    iterationCount: number;
    tokenUsage: unknown;
    finalResult?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: run.id,
      organizationId: run.organizationId,
      userId: run.userId,
      repositoryId: run.repositoryId,
      branch: run.branch,
      task: run.task,
      status: run.status,
      currentStep: run.currentStep,
      plan: run.plan,
      discoveredFiles: run.discoveredFiles,
      relevantFiles: run.relevantFiles,
      modifiedFiles: run.modifiedFiles,
      iterationCount: run.iterationCount,
      tokenUsage: run.tokenUsage,
      finalResult: run.finalResult,
      error: run.error,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  },
};
