import { Request, Response } from "express";
import { aiSettingsService } from "../services/aiSettingsService";
import { geminiProvider, ALLOWED_GEMINI_MODELS } from "../services/ai/geminiProvider";
import { aiService } from "../services/aiService";
import { aiModelFetcher } from "../services/aiModelFetcher";

export const aiController = {
  // ─── SETTINGS & CREDENTIALS ──────────────────────────────────────────────────

  async getSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const settings = await aiSettingsService.getSettings(orgId);
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async saveSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const { provider = "google", apiKey, selectedModel, baseUrl } = req.body;

      if (!selectedModel) {
        return res.status(400).json({ success: false, error: "Selected model is required." });
      }

      await aiSettingsService.saveSettings({
        organizationId: orgId,
        provider,
        apiKey,
        selectedModel,
        baseUrl,
      });

      return res.json({ success: true, message: "AI provider settings saved successfully." });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async testCredentials(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      let { apiKey, provider = "google", selectedModel } = req.body;

      const saved = await aiSettingsService.getDecryptedApiKey(orgId);
      if (!apiKey && saved?.apiKey) {
        apiKey = saved.apiKey;
      }
      if (!selectedModel && saved?.selectedModel) {
        selectedModel = saved.selectedModel;
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: "API key is required to test credentials.",
        });
      }

      const result = await geminiProvider.validateCredentials(apiKey, selectedModel);
      if (!result.valid) {
        return res.status(400).json({
          success: false,
          error: result.error || "Failed to validate Gemini API key.",
        });
      }

      return res.json({
        success: true,
        message: result.modelUsed
          ? `Gemini API key is valid (verified with model ${result.modelUsed}).`
          : "Gemini API key is valid and connected.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async fetchModels(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const seen = new Set<string>();
      const models: Array<{ id: string; name: string; description?: string }> = [];

      for (const m of ALLOWED_GEMINI_MODELS) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          models.push({ id: m.id, name: m.name, description: m.description });
        }
      }

      const credentials = await aiSettingsService.getDecryptedApiKey(orgId);
      if (credentials?.apiKey) {
        const live = await aiModelFetcher.fetchGoogleModels(credentials.apiKey);
        for (const m of live) {
          if (!seen.has(m.id)) {
            seen.add(m.id);
            models.push({ id: m.id, name: m.name, description: m.description });
          }
        }
      }

      models.sort((a, b) => a.id.localeCompare(b.id));

      return res.json({
        success: true,
        count: models.length,
        models,
        allowCustom: true,
        provider: "google",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // ─── CONVERSATIONS ───────────────────────────────────────────────────────────

  async listConversations(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const conversations = await aiService.listConversations(orgId, userId);
      return res.json({ success: true, conversations });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async createConversation(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const { title, model, repositoryId, branch } = req.body;

      const conversation = await aiService.createConversation(orgId, userId, {
        title,
        model,
        repositoryId,
        branch,
      });

      return res.status(201).json({ success: true, conversation });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getConversation(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const id = String(req.params.id);

      const result = await aiService.getConversation(orgId, userId, id);
      return res.json({
        success: true,
        conversation: result.conversation,
        messages: result.messages,
      });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },

  async deleteConversation(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const id = String(req.params.id);

      const deleted = await aiService.deleteConversation(orgId, userId, id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Conversation not found." });
      }

      return res.json({ success: true, message: "Conversation deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // ─── CHAT & STREAMING ────────────────────────────────────────────────────────

  async chat(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const {
        conversationId,
        message,
        model,
        repositoryId,
        branch,
        filePaths,
        includeRepoContext,
      } = req.body;

      const result = await aiService.chat(orgId, userId, {
        conversationId,
        message,
        model,
        repositoryId,
        branch,
        filePaths,
        includeRepoContext,
      });

      return res.json(result);
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },

  async chatStream(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).userId;
      const {
        conversationId,
        message,
        model,
        repositoryId,
        branch,
        filePaths,
        includeRepoContext,
      } = req.body;

      // Set headers for Server-Sent Events (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders?.();

      const generator = aiService.chatStream(orgId, userId, {
        conversationId,
        message,
        model,
        repositoryId,
        branch,
        filePaths,
        includeRepoContext,
      });

      for await (const event of generator) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      res.end();
    } catch (err: any) {
      res.write(
        `data: ${JSON.stringify({
          type: "error",
          error: err.message || "Failed to stream chat response.",
        })}\n\n`
      );
      res.end();
    }
  },

  async generateCode(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const { specId, language } = req.body;
      if (!specId) {
        return res.status(400).json({ success: false, error: "specId is required." });
      }
      const result = await aiService.generateCode(orgId, specId, language);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
