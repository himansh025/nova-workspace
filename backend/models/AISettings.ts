import mongoose, { Schema, Document, Model } from "mongoose";

// ─── AISettings ───────────────────────────────────────────────────────────────
// Per-organization AI configuration. API key is stored encrypted.
// The model is fetched dynamically from the provider's API — not hardcoded.

export type AIProvider = "openai" | "google" | "anthropic" | "ollama" | "custom";

export interface IAISettings {
  _id: mongoose.Types.ObjectId;
  organizationId: string;
  provider: AIProvider;
  // Encrypted API key — use aiSettingsService to encrypt/decrypt
  encryptedApiKey: string;
  // The selected model id (e.g. "gpt-4o", "gemini-1.5-pro", "claude-3-5-sonnet-20241022")
  selectedModel: string;
  // Optional: custom base URL for Ollama or compatible APIs
  baseUrl?: string;
  // Optional: custom provider display name
  customProviderName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAISettingsDocument extends IAISettings, Document {}

const AISettingsSchema = new Schema<IAISettingsDocument>(
  {
    organizationId: { type: String, required: true, unique: true, index: true },
    provider: {
      type: String,
      enum: ["openai", "google", "anthropic", "ollama", "custom"],
      required: true,
    },
    encryptedApiKey: { type: String, required: true },
    selectedModel: { type: String, required: true },
    baseUrl: { type: String },
    customProviderName: { type: String },
  },
  { timestamps: true }
);

export const AISettingsModel: Model<IAISettingsDocument> =
  mongoose.models.AISettings ||
  mongoose.model<IAISettingsDocument>("AISettings", AISettingsSchema);
