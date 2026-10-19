import { aiSettingsService } from "../../aiSettingsService";
import { geminiProvider } from "../geminiProvider";
import type { AIProvider, GenerateOptions, GenerateResult } from "../aiProviderTypes";
import {
  classifyTaskComplexity,
  resolveModelForTask,
  type AgentModelTask,
  type TaskComplexity,
} from "./agentModelRouting";

export interface ModelRouterGenerateParams {
  organizationId: string;
  model?: string;
  task?: AgentModelTask;
  /** When set, chooses fast vs strong model (unless task-specific override). */
  complexity?: TaskComplexity;
  /** Used to infer complexity when `complexity` is omitted. */
  taskText?: string;
  complexityHints?: { planStepCount?: number; modifiedFileCount?: number };
  options: Omit<GenerateOptions, "model">;
}

export interface ModelRouterConfig {
  enableTaskRouting: boolean;
}

/**
 * Routes generation to the org AI provider with configurable model selection.
 */
export class ModelRouter {
  constructor(
    private readonly provider: AIProvider = geminiProvider,
    private readonly config: ModelRouterConfig = { enableTaskRouting: true }
  ) {}

  classifyComplexity(
    taskText: string,
    hints?: { planStepCount?: number; modifiedFileCount?: number }
  ): TaskComplexity {
    return classifyTaskComplexity(taskText, hints);
  }

  resolveModelId(params: {
    organizationId: string;
    userModel?: string;
    task?: AgentModelTask;
    complexity?: TaskComplexity;
    taskText?: string;
    complexityHints?: { planStepCount?: number; modifiedFileCount?: number };
  }): Promise<string> {
    return this.pickModel(params);
  }

  private async pickModel(params: {
    organizationId: string;
    userModel?: string;
    task?: AgentModelTask;
    complexity?: TaskComplexity;
    taskText?: string;
    complexityHints?: { planStepCount?: number; modifiedFileCount?: number };
  }): Promise<string> {
    const credentials = await aiSettingsService.getDecryptedApiKey(params.organizationId);
    const orgDefault = credentials?.selectedModel;

    if (!params.task || !this.config.enableTaskRouting) {
      return params.userModel || orgDefault || "gemini-2.5-flash";
    }

    const complexity =
      params.complexity ??
      (params.taskText
        ? classifyTaskComplexity(params.taskText, params.complexityHints)
        : "complex");

    return resolveModelForTask({
      task: params.task,
      complexity,
      userModel: params.userModel,
      orgDefault,
    });
  }

  async generate(params: ModelRouterGenerateParams): Promise<GenerateResult> {
    const credentials = await aiSettingsService.getDecryptedApiKey(params.organizationId);
    if (!credentials?.apiKey) {
      const err = new Error(
        "AI provider is not configured for this organization. Add an API key in AI settings."
      ) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const model = params.task
      ? await this.pickModel({
          organizationId: params.organizationId,
          userModel: params.model,
          task: params.task,
          complexity: params.complexity,
          taskText: params.taskText,
          complexityHints: params.complexityHints,
        })
      : params.model || credentials.selectedModel || "gemini-2.5-flash";

    return this.provider.generate(credentials.apiKey, {
      ...params.options,
      model,
    });
  }
}

export const modelRouter = new ModelRouter();
