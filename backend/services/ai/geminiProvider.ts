import { GoogleGenAI } from "@google/genai";
import {
  AIProvider,
  AIModelInfo,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  AIChatMessage,
} from "./aiProviderTypes";

/**
 * Maps UI labels like "3.6 flash" or "Gemini 3.6 Flash" to API id `gemini-3.6-flash`.
 */
export function normalizeGeminiModelId(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  let s = raw.trim().toLowerCase().replace(/^models\//, "");
  s = s.replace(/\s+/g, "-");
  if (/^\d+\.\d+(-flash.*)?$/.test(s)) {
    s = `gemini-${s.replace(/-flash.*/, "")}-flash`;
  } else if (!s.startsWith("gemini-") && /^\d+\.\d+-flash/.test(s)) {
    s = `gemini-${s}`;
  } else if (s.startsWith("gemini") && !s.startsWith("gemini-")) {
    s = s.replace(/^gemini/, "gemini-");
  }
  return s;
}

export const ALLOWED_GEMINI_MODELS: AIModelInfo[] = [
  {
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini",
    description: "Frontier-class fast model for agentic workflows and coding (GA).",
    maxInputTokens: 1048576,
    maxOutputTokens: 65536,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: true,
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "gemini",
    description: "Balanced speed and reasoning in the Gemini 3 family.",
    maxInputTokens: 1048576,
    maxOutputTokens: 65536,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fast, highly versatile and capable model with low latency and 1M token context window.",
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    description: "Google's most capable model for complex reasoning, architectural analysis, and deep tasks.",
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Next-generation fast multimodal model with real-time performance.",
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "gemini",
    description: "High capacity model built for large context reasoning across multiple files.",
    maxInputTokens: 2097152,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini",
    description: "Lightweight, cost-efficient model for rapid responses.",
    maxInputTokens: 1048576,
    maxOutputTokens: 8192,
    capabilities: {
      textGeneration: true,
      streaming: true,
      multimodal: true,
      longContext: true,
    },
    isDefault: false,
  },
];

export class GeminiProvider implements AIProvider {
  public readonly name = "gemini";

  /**
   * Helper to convert Nova chat messages into Gemini API contents structure.
   */
  private formatContents(messages: AIChatMessage[]) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));
  }

  private parseErrorPayload(message: string): { status?: number; apiStatus?: string } {
    try {
      const jsonStart = message.indexOf("{");
      if (jsonStart === -1) return {};
      const parsed = JSON.parse(message.slice(jsonStart));
      const err = parsed?.error ?? parsed;
      const status = typeof err?.code === "number" ? err.code : undefined;
      const apiStatus = typeof err?.status === "string" ? err.status : undefined;
      return { status, apiStatus };
    } catch {
      return {};
    }
  }

  /**
   * Translates SDK or network errors into clean, structured user-safe error messages.
   */
  private handleGeminiError(error: any): Error {
    const message = error?.message || String(error);
    const parsed = this.parseErrorPayload(message);
    const status =
      error?.status || error?.statusCode || error?.response?.status || parsed.status;
    const apiStatus = parsed.apiStatus || "";

    if (
      status === 400 ||
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid") ||
      message.includes("invalid api key")
    ) {
      const err = new Error("Invalid Gemini API key. Please check your API key in AI Settings.");
      (err as any).statusCode = 401;
      (err as any).code = "INVALID_API_KEY";
      return err;
    }

    if (status === 429 || message.includes("RESOURCE_EXHAUSTED") || message.includes("Quota exceeded")) {
      const err = new Error("Gemini quota or rate limit exceeded. Please try again shortly or check your Gemini plan.");
      (err as any).statusCode = 429;
      (err as any).code = "RATE_LIMIT_EXCEEDED";
      return err;
    }

    if (
      status === 503 ||
      apiStatus === "UNAVAILABLE" ||
      message.includes("high demand") ||
      message.includes("UNAVAILABLE")
    ) {
      const err = new Error(
        "This Gemini model is temporarily overloaded (high demand). Wait a minute and retry, or switch to another model (e.g. gemini-2.5-flash or gemini-3.5-flash) in AI Settings."
      );
      (err as any).statusCode = 503;
      (err as any).code = "SERVICE_UNAVAILABLE";
      return err;
    }

    if (status === 404 || apiStatus === "NOT_FOUND" || message.includes("NOT_FOUND")) {
      const detail = message.length < 220 ? message : message.slice(0, 220);
      const err = new Error(
        `Requested Gemini model was not found. Use the exact id (e.g. gemini-3.6-flash). ${detail}`
      );
      (err as any).statusCode = 404;
      (err as any).code = "MODEL_NOT_FOUND";
      return err;
    }

    if (message.includes("SAFETY") || message.includes("BLOCKED")) {
      const err = new Error("The request was blocked by Gemini safety filters.");
      (err as any).statusCode = 400;
      (err as any).code = "SAFETY_VIOLATION";
      return err;
    }

    const err = new Error(`Gemini Provider error: ${message}`);
    (err as any).statusCode = status || 500;
    (err as any).code = "GEMINI_ERROR";
    return err;
  }

  /**
   * Validates if a model ID is allowed.
   */
  public isModelSupported(modelId: string): boolean {
    return ALLOWED_GEMINI_MODELS.some((m) => m.id === modelId);
  }

  /**
   * Resolves target model ID or falls back to default.
   */
  public resolveModelId(modelId?: string): string {
    const id = normalizeGeminiModelId(modelId);
    if (!id) {
      return ALLOWED_GEMINI_MODELS.find((m) => m.isDefault)?.id || "gemini-3.6-flash";
    }
    if (this.isModelSupported(id)) {
      return id;
    }
    // Allow any Gemini API model id saved in settings (e.g. from live catalog or custom).
    if (/^gemini-[a-z0-9][a-z0-9._-]*$/i.test(id)) {
      return id;
    }
    return ALLOWED_GEMINI_MODELS.find((m) => m.isDefault)?.id || "gemini-3.6-flash";
  }

  private static readonly CREDENTIAL_TEST_FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ];

  /**
   * Tests API key connectivity against the Gemini API using the requested model (with safe fallbacks).
   */
  public async validateCredentials(
    apiKey: string,
    preferredModelId?: string
  ): Promise<{ valid: boolean; error?: string; modelUsed?: string }> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return { valid: false, error: "API key is required" };
    }

    const trimmedKey = apiKey.trim();
    const preferred = preferredModelId?.trim()
      ? this.resolveModelId(preferredModelId)
      : undefined;

    const modelsToTry = [
      ...(preferred ? [preferred] : []),
      ...GeminiProvider.CREDENTIAL_TEST_FALLBACK_MODELS.filter((m) => m !== preferred),
    ];
    const tried: string[] = [];

    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    let lastError: Error | null = null;

    for (const model of modelsToTry) {
      tried.push(model);
      try {
        const response = await ai.models.generateContent({
          model,
          contents: "Respond with ok",
          config: {
            maxOutputTokens: 5,
            temperature: 0.1,
          },
        });
        if (response) {
          return { valid: true, modelUsed: model };
        }
        return { valid: true, modelUsed: model };
      } catch (err: any) {
        lastError = this.handleGeminiError(err);
        const code = (lastError as any).code;
        if (
          code === "MODEL_NOT_FOUND" ||
          code === "SERVICE_UNAVAILABLE" ||
          code === "RATE_LIMIT_EXCEEDED"
        ) {
          continue;
        }
        return { valid: false, error: lastError.message };
      }
    }

    const retiredHint =
      preferred && /gemini-1\.0/i.test(preferred)
        ? ` Model "${preferred}" is retired — use gemini-2.5-flash or pick from Refresh Catalog.`
        : preferred
          ? ` None of the tried models worked for "${preferred}". Use Refresh Catalog or gemini-2.5-flash.`
          : " Check the key from Google AI Studio (aistudio.google.com) and that Generative Language API is enabled.";

    const overloadHint =
      (lastError as any)?.code === "SERVICE_UNAVAILABLE"
        ? " All tried models were busy — your API key is likely valid; retry later or pick a less busy model."
        : "";

    return {
      valid: false,
      error:
        (lastError?.message || "Gemini connection failed.") +
        overloadHint +
        retiredHint +
        ` Tried models: ${tried.join(", ")}.`,
    };
  }

  /**
   * Returns list of supported Gemini models.
   */
  public async listModels(_apiKey?: string): Promise<AIModelInfo[]> {
    return ALLOWED_GEMINI_MODELS;
  }

  /**
   * Generates a complete response (non-streaming).
   */
  public async generate(apiKey: string, options: GenerateOptions): Promise<GenerateResult> {
    const startTime = Date.now();
    try {
      const modelId = this.resolveModelId(options.model);
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      // Gather system instructions
      const systemMessages = options.messages.filter((m) => m.role === "system");
      let systemInstruction = options.systemInstruction;
      if (systemMessages.length > 0) {
        const sysContent = systemMessages.map((m) => m.content).join("\n\n");
        systemInstruction = systemInstruction ? `${systemInstruction}\n\n${sysContent}` : sysContent;
      }

      const contents = this.formatContents(options.messages);

      const response = await ai.models.generateContent({
        model: modelId,
        contents: contents.length > 0 ? contents : "Hello",
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      });

      const text = response.text || "";
      const usageMetadata = (response as any).usageMetadata;

      return {
        text,
        usage: usageMetadata
          ? {
              promptTokens: usageMetadata.promptTokenCount,
              completionTokens: usageMetadata.candidatesTokenCount,
              totalTokens: usageMetadata.totalTokenCount,
            }
          : undefined,
        finishReason: (response as any).candidates?.[0]?.finishReason,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      throw this.handleGeminiError(err);
    }
  }

  /**
   * Streams responses incrementally from Gemini.
   */
  public async *generateStream(apiKey: string, options: GenerateOptions): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      const modelId = this.resolveModelId(options.model);
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

      // Gather system instructions
      const systemMessages = options.messages.filter((m) => m.role === "system");
      let systemInstruction = options.systemInstruction;
      if (systemMessages.length > 0) {
        const sysContent = systemMessages.map((m) => m.content).join("\n\n");
        systemInstruction = systemInstruction ? `${systemInstruction}\n\n${sysContent}` : sysContent;
      }

      const contents = this.formatContents(options.messages);

      const responseStream = await ai.models.generateContentStream({
        model: modelId,
        contents: contents.length > 0 ? contents : "Hello",
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 8192,
        },
      });

      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        const usageMetadata = (chunk as any).usageMetadata;
        yield {
          text,
          finishReason: (chunk as any).candidates?.[0]?.finishReason,
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount,
                completionTokens: usageMetadata.candidatesTokenCount,
                totalTokens: usageMetadata.totalTokenCount,
              }
            : undefined,
        };
      }
    } catch (err: any) {
      throw this.handleGeminiError(err);
    }
  }
}

export const geminiProvider = new GeminiProvider();
