import crypto from "crypto";
import { aiSettingsService } from "./aiSettingsService";
import { geminiProvider, ALLOWED_GEMINI_MODELS } from "./ai/geminiProvider";
import { aiRepositoryContextBuilder, IAIContextMetadata } from "./ai/aiRepositoryContextBuilder";
import { redactSecrets } from "./ai/secretRedactor";
import { AIConversationModel, IAIConversationDocument } from "../models/AIConversation";
import { AIMessageModel, IAIMessageDocument } from "../models/AIMessage";
import { AIChatMessage } from "./ai/aiProviderTypes";

export interface IChatOptions {
  conversationId?: string;
  message: string;
  model?: string;
  repositoryId?: string;
  branch?: string;
  filePaths?: string[];
  includeRepoContext?: boolean;
}

export interface IChatResponse {
  success: boolean;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  provider: string;
  model: string;
  response: string;
  contextMetadata?: {
    repositoryFullName?: string;
    branch?: string;
    sources?: Array<{ path: string; size?: number; linesCount?: number }>;
    truncated?: boolean;
  };
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    durationMs?: number;
  };
}

export const aiService = {
  // ─── CONVERSATIONS CRUD ────────────────────────────────────────────────────────

  async createConversation(
    organizationId: string,
    userId: string,
    params: {
      title?: string;
      model?: string;
      repositoryId?: string;
      branch?: string;
    } = {}
  ): Promise<IAIConversationDocument> {
    const id = `conv-${crypto.randomUUID()}`;
    const selectedModel = params.model || ALLOWED_GEMINI_MODELS[0].id;
    const title = (params.title || "New Conversation").trim().slice(0, 100);

    const conversation = await AIConversationModel.create({
      id,
      organizationId,
      userId,
      provider: "gemini",
      selectedModel,
      title,
      repositoryId: params.repositoryId,
      branch: params.branch,
    });

    return conversation;
  },

  async listConversations(
    organizationId: string,
    userId: string
  ): Promise<IAIConversationDocument[]> {
    return AIConversationModel.find({ organizationId, userId })
      .sort({ updatedAt: -1 })
      .limit(50);
  },

  async getConversation(
    organizationId: string,
    userId: string,
    conversationId: string
  ): Promise<{
    conversation: IAIConversationDocument;
    messages: IAIMessageDocument[];
  }> {
    const conversation = await AIConversationModel.findOne({
      id: conversationId,
      organizationId,
      userId,
    });

    if (!conversation) {
      const err = new Error("Conversation not found.");
      (err as any).statusCode = 404;
      throw err;
    }

    const messages = await AIMessageModel.find({
      conversationId,
      organizationId,
    }).sort({ createdAt: 1 });

    return { conversation, messages };
  },

  async deleteConversation(
    organizationId: string,
    userId: string,
    conversationId: string
  ): Promise<boolean> {
    const deleted = await AIConversationModel.findOneAndDelete({
      id: conversationId,
      organizationId,
      userId,
    });

    if (deleted) {
      await AIMessageModel.deleteMany({ conversationId, organizationId });
      return true;
    }
    return false;
  },

  // ─── CHAT & STREAMING ──────────────────────────────────────────────────────────

  async chat(
    organizationId: string,
    userIdOrMessage: string,
    optionsOrPreset?: IChatOptions | string
  ): Promise<any> {
    if (typeof optionsOrPreset === "object" && optionsOrPreset !== null) {
      const userId = userIdOrMessage;
      const options = optionsOrPreset;
      const { userMessage, conversation, contextResult, decryptedApiKey, selectedModel } =
        await this.prepareChatContext(organizationId, userId, options);

      // Build message history for the provider
      const historyMessages = await AIMessageModel.find({
        conversationId: conversation.id,
        organizationId,
      })
        .sort({ createdAt: 1 })
        .limit(30);

      const chatMessages: AIChatMessage[] = historyMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      // Inject system instructions and repository context
      let systemInstruction = "You are Nova AI, an expert software architecture and engineering assistant.";
      if (contextResult) {
        systemInstruction += `\n\n${contextResult.contextBlock}`;
      }

      const result = await geminiProvider.generate(decryptedApiKey, {
        model: selectedModel,
        systemInstruction,
        messages: chatMessages,
      });

      // Persist assistant message
      const assistantMessageId = `msg-${crypto.randomUUID()}`;
      const assistantMessage = await AIMessageModel.create({
        id: assistantMessageId,
        conversationId: conversation.id,
        organizationId,
        userId,
        role: "assistant",
        content: result.text,
        contextMetadata: contextResult
          ? {
              repositoryFullName: contextResult.metadata.repositoryName,
              branch: contextResult.metadata.branch,
              sources: contextResult.metadata.sources.map((s) => ({
                path: s.path,
                size: s.size,
                linesCount: s.linesCount,
              })),
              truncated: contextResult.metadata.sources.some((s) => s.truncated),
            }
          : undefined,
        usage: {
          promptTokens: result.usage?.promptTokens,
          completionTokens: result.usage?.completionTokens,
          totalTokens: result.usage?.totalTokens,
          durationMs: result.durationMs,
        },
      });

      // Update conversation title if this is the first turn
      if (historyMessages.length <= 2 && conversation.title === "New Conversation") {
        const generatedTitle = userMessage.slice(0, 40).trim() || "Chat";
        await AIConversationModel.updateOne(
          { id: conversation.id },
          { title: generatedTitle, updatedAt: new Date() }
        );
      } else {
        await AIConversationModel.updateOne(
          { id: conversation.id },
          { updatedAt: new Date() }
        );
      }

      return {
        success: true,
        conversationId: conversation.id,
        userMessageId: (options as any).userMessageId || "msg-user",
        assistantMessageId: assistantMessage.id,
        provider: "gemini",
        model: selectedModel,
        response: result.text,
        contextMetadata: assistantMessage.contextMetadata,
        usage: assistantMessage.usage,
      };
    } else {
      const message = userIdOrMessage;
      const preset = optionsOrPreset as string | undefined;
      const userId = "system";
      return this.chat(organizationId, userId, {
        message: message || preset || "Hello",
      });
    }
  },

  async *chatStream(
    organizationId: string,
    userId: string,
    options: IChatOptions
  ): AsyncGenerator<
    | { type: "start"; conversationId: string; userMessageId: string }
    | { type: "chunk"; text: string }
    | {
        type: "done";
        assistantMessageId: string;
        fullText: string;
        usage?: any;
        contextMetadata?: any;
      }
    | { type: "error"; error: string },
    void,
    unknown
  > {
    const startTime = Date.now();
    try {
      const { userMessage, conversation, contextResult, decryptedApiKey, selectedModel } =
        await this.prepareChatContext(organizationId, userId, options);

      const userMessageId = `msg-${crypto.randomUUID()}`;
      yield {
        type: "start",
        conversationId: conversation.id,
        userMessageId,
      };

      const historyMessages = await AIMessageModel.find({
        conversationId: conversation.id,
        organizationId,
      })
        .sort({ createdAt: 1 })
        .limit(30);

      const chatMessages: AIChatMessage[] = historyMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      let systemInstruction = "You are Nova AI, an expert software architecture and engineering assistant.";
      if (contextResult) {
        systemInstruction += `\n\n${contextResult.contextBlock}`;
      }

      let fullText = "";
      let lastUsage: any = undefined;

      const stream = geminiProvider.generateStream(decryptedApiKey, {
        model: selectedModel,
        systemInstruction,
        messages: chatMessages,
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          fullText += chunk.text;
          yield { type: "chunk", text: chunk.text };
        }
        if (chunk.usage) {
          lastUsage = chunk.usage;
        }
      }

      // Persist assistant message
      const assistantMessageId = `msg-${crypto.randomUUID()}`;
      const assistantMessage = await AIMessageModel.create({
        id: assistantMessageId,
        conversationId: conversation.id,
        organizationId,
        userId,
        role: "assistant",
        content: fullText,
        contextMetadata: contextResult
          ? {
              repositoryFullName: contextResult.metadata.repositoryName,
              branch: contextResult.metadata.branch,
              sources: contextResult.metadata.sources.map((s) => ({
                path: s.path,
                size: s.size,
                linesCount: s.linesCount,
              })),
              truncated: contextResult.metadata.sources.some((s) => s.truncated),
            }
          : undefined,
        usage: {
          promptTokens: lastUsage?.promptTokens,
          completionTokens: lastUsage?.completionTokens,
          totalTokens: lastUsage?.totalTokens,
          durationMs: Date.now() - startTime,
        },
      });

      // Update conversation title / timestamp
      if (historyMessages.length <= 2 && conversation.title === "New Conversation") {
        const generatedTitle = userMessage.slice(0, 40).trim() || "Chat";
        await AIConversationModel.updateOne(
          { id: conversation.id },
          { title: generatedTitle, updatedAt: new Date() }
        );
      } else {
        await AIConversationModel.updateOne(
          { id: conversation.id },
          { updatedAt: new Date() }
        );
      }

      yield {
        type: "done",
        assistantMessageId: assistantMessage.id,
        fullText,
        usage: assistantMessage.usage,
        contextMetadata: assistantMessage.contextMetadata,
      };
    } catch (err: any) {
      yield {
        type: "error",
        error: err.message || "An error occurred during Gemini generation.",
      };
    }
  },

  // ─── HELPERS ─────────────────────────────────────────────────────────────────

  async prepareChatContext(
    organizationId: string,
    userId: string,
    options: IChatOptions
  ) {
    const rawMessage = (options.message || "").trim();
    if (!rawMessage) {
      const err = new Error("Message content cannot be empty.");
      (err as any).statusCode = 400;
      throw err;
    }

    const { sanitized: sanitizedUserMessage } = redactSecrets(rawMessage);

    // Retrieve decrypted API key for the organization
    const config = await aiSettingsService.getDecryptedApiKey(organizationId);
    if (!config || !config.apiKey) {
      const err = new Error(
        "Gemini API key is not configured for your organization. Please configure it in AI Settings."
      );
      (err as any).statusCode = 400;
      (err as any).code = "AI_NOT_CONFIGURED";
      throw err;
    }

    const selectedModel = geminiProvider.resolveModelId(options.model || config.selectedModel);

    // Resolve or create conversation
    let conversation: IAIConversationDocument | null = null;
    if (options.conversationId) {
      conversation = await AIConversationModel.findOne({
        id: options.conversationId,
        organizationId,
        userId,
      });
    }

    if (!conversation) {
      conversation = await this.createConversation(organizationId, userId, {
        model: selectedModel,
        repositoryId: options.repositoryId,
        branch: options.branch,
      });
    }

    // Optionally build repository context
    let contextResult: { contextBlock: string; metadata: IAIContextMetadata } | null = null;
    const targetRepoId = options.repositoryId || conversation.repositoryId;
    const targetBranch = options.branch || conversation.branch;

    if (options.includeRepoContext && targetRepoId) {
      try {
        contextResult = await aiRepositoryContextBuilder.buildContext({
          organizationId,
          repositoryId: targetRepoId,
          branch: targetBranch,
          filePaths: options.filePaths,
          includeOverview: true,
        });
      } catch (repoErr: any) {
        console.warn("[aiService] Failed to load repository context:", repoErr.message);
      }
    }

    // Persist user message
    const userMessageId = `msg-${crypto.randomUUID()}`;
    await AIMessageModel.create({
      id: userMessageId,
      conversationId: conversation.id,
      organizationId,
      userId,
      role: "user",
      content: sanitizedUserMessage,
    });

    return {
      userMessage: sanitizedUserMessage,
      conversation,
      contextResult,
      decryptedApiKey: config.apiKey,
      selectedModel,
    };
  },

  // ─── LEGACY CALLER SUPPORT ───────────────────────────────────────────────────

  async callLLM(
    config: { provider: string; apiKey: string; selectedModel: string; baseUrl?: string },
    prompt: string
  ): Promise<string> {
    if (config.provider === "google" || config.provider === "gemini") {
      const result = await geminiProvider.generate(config.apiKey, {
        model: config.selectedModel,
        messages: [{ role: "user", content: prompt }],
      });
      return result.text;
    }

    throw new Error(`Unsupported AI provider: ${config.provider}`);
  },

  async generateCode(organizationId: string, specId: string, language: string = "typescript") {
    const config = await aiSettingsService.getDecryptedApiKey(organizationId);
    if (!config) {
      throw new Error("Gemini API key is not configured for your organization.");
    }

    const { SpecModel } = require("../models/Spec");
    const spec = await SpecModel.findOne({ organizationId, $or: [{ id: specId }, { key: specId }] });
    if (!spec) throw new Error("Specification not found.");

    const prompt = `
Generate production-ready, clean ${language} code based on this engineering specification:
Title: ${spec.title}
Summary: ${spec.summary}
Requirements / Architecture Content:
${spec.content}

Return ONLY the code without conversational preamble. Include inline documentation and TypeScript types where applicable.
`;

    const generatedCode = await this.callLLM(config, prompt);
    const cleanCode = generatedCode.replace(/```[a-z]*\n?/gi, "").trim();
    return {
      success: true,
      configured: true,
      language,
      code: cleanCode,
    };
  },
};
