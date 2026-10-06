import { GoogleGenAI } from "@google/genai";
import {
  AIProvider,
  AIModelInfo,
  GenerateOptions,
  GenerateResult,
  StreamChunk,
  AIChatMessage,
} from "./aiProviderTypes";

export const ALLOWED_GEMINI_MODELS: AIModelInfo[] = [
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
    isDefault: true,
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

  /**
   * Translates SDK or network errors into clean, structured user-safe error messages.
   */
  private handleGeminiError(error: any): Error {
    const message = error?.message || String(error);
    const status = error?.status || error?.statusCode || error?.response?.status;

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

    if (status === 404 || message.includes("NOT_FOUND") || message.includes("models/")) {
      const err = new Error(`Requested Gemini model not found or unavailable.`);
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
    if (modelId && this.isModelSupported(modelId)) {
      return modelId;
    }
    return ALLOWED_GEMINI_MODELS.find((m) => m.isDefault)?.id || "gemini-2.5-flash";
  }

  /**
   * Tests API key connectivity and authentication against the Gemini API.
   */
  public async validateCredentials(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
      return { valid: false, error: "API key is required" };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Respond with 'ok'",
        config: {
          maxOutputTokens: 5,
          temperature: 0.1,
        },
      });

      if (response && response.text) {
        return { valid: true };
      }
      return { valid: true };
    } catch (err: any) {
      const mappedError = this.handleGeminiError(err);
      return { valid: false, error: mappedError.message };
    }
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
