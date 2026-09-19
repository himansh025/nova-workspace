import { Request, Response } from "express";
import { aiSettingsService } from "../services/aiSettingsService";
import { aiModelFetcher } from "../services/aiModelFetcher";
import { aiService } from "../services/aiService";

export const aiController = {
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
      const { provider, apiKey, selectedModel, baseUrl } = req.body;

      if (!provider || !selectedModel) {
        return res.status(400).json({ success: false, error: "Provider and selected model are required." });
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

  async fetchModels(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const provider = req.query.provider as any;
      let apiKey = req.query.apiKey as string;
      const baseUrl = req.query.baseUrl as string;

      if (!provider) {
        return res.status(400).json({ success: false, error: "Provider is required." });
      }

      // If apiKey not passed in query, try using saved decrypted key from DB
      if (!apiKey) {
        const saved = await aiSettingsService.getDecryptedApiKey(orgId);
        if (saved && saved.provider === provider) {
          apiKey = saved.apiKey;
        }
      }

      if (!apiKey && provider !== "ollama") {
        return res.status(400).json({ success: false, error: "API key is required to query available models." });
      }

      const models = await aiModelFetcher.fetchModels(provider, apiKey || "", baseUrl);
      return res.json({ success: true, count: models.length, models });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async chat(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const { message, presetId } = req.body;
      const result = await aiService.chat(orgId, message || "", presetId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
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
