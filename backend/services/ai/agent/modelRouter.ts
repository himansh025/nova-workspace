import { aiSettingsService } from "../../aiSettingsService";
import { geminiProvider } from "../geminiProvider";
import type { AIProvider, GenerateOptions, GenerateResult } from "../aiProviderTypes";

export interface ModelRouterGenerateParams {
  organizationId: string;
  model?: string;
  options: Omit<GenerateOptions, "model">;
}

/**
 * Routes generation requests to the configured org AI provider (Gemini today).
 */
export class ModelRouter {
  constructor(private readonly provider: AIProvider = geminiProvider) {}

  async generate(params: ModelRouterGenerateParams): Promise<GenerateResult> {
    const credentials = await aiSettingsService.getDecryptedApiKey(params.organizationId);
    if (!credentials?.apiKey) {
      const err = new Error(
        "AI provider is not configured for this organization. Add an API key in AI settings."
      ) as Error & { statusCode?: number };
      err.statusCode = 400;
      throw err;
    }

    const model =
      params.model ||
      credentials.selectedModel ||
      "gemini-2.5-flash";

    return this.provider.generate(credentials.apiKey, {
      ...params.options,
      model,
    });
  }
}

export const modelRouter = new ModelRouter();
