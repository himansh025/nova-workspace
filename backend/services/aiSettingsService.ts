import { AISettingsModel, IAISettingsDocument, AIProvider } from "../models/AISettings";
import { encryptSecret, decryptSecret } from "./cryptoService";
import { normalizeGeminiModelId } from "./ai/geminiProvider";

export const aiSettingsService = {
  async getSettings(organizationId: string) {
    const doc = await AISettingsModel.findOne({ organizationId });
    if (!doc) {
      return {
        configured: false,
        provider: "google" as AIProvider,
        selectedModel: "gemini-1.5-flash",
        hasKey: false,
        maskedKey: "",
        baseUrl: "",
      };
    }

    const decrypted = decryptSecret(doc.encryptedApiKey);
    const maskedKey = decrypted
      ? `${decrypted.slice(0, 4)}••••••••${decrypted.slice(-4)}`
      : "";

    return {
      configured: true,
      provider: doc.provider,
      selectedModel: doc.selectedModel,
      hasKey: !!decrypted,
      maskedKey,
      baseUrl: doc.baseUrl || "",
    };
  },

  async saveSettings(input: {
    organizationId: string;
    provider: AIProvider;
    apiKey?: string;
    selectedModel: string;
    baseUrl?: string;
  }): Promise<void> {
    const existing = await AISettingsModel.findOne({ organizationId: input.organizationId });

    let encryptedApiKey = existing?.encryptedApiKey || "";
    if (input.apiKey && input.apiKey.trim().length > 0) {
      encryptedApiKey = encryptSecret(input.apiKey.trim());
    }

    if (!encryptedApiKey) {
      throw new Error("An API key is required to configure the AI provider.");
    }

    await AISettingsModel.findOneAndUpdate(
      { organizationId: input.organizationId },
      {
        provider: input.provider,
        encryptedApiKey,
        selectedModel: normalizeGeminiModelId(input.selectedModel) || input.selectedModel.trim(),
        baseUrl: input.baseUrl?.trim() || "",
      },
      { upsert: true, returnDocument: "after" }
    );
  },

  async getDecryptedApiKey(organizationId: string): Promise<{
    provider: AIProvider;
    apiKey: string;
    selectedModel: string;
    baseUrl?: string;
  } | null> {
    const doc = await AISettingsModel.findOne({ organizationId });
    if (!doc) return null;

    const apiKey = decryptSecret(doc.encryptedApiKey);
    if (!apiKey) return null;

    return {
      provider: doc.provider,
      apiKey,
      selectedModel: doc.selectedModel,
      baseUrl: doc.baseUrl,
    };
  },
};
