import { AIProvider } from "../models/AISettings";

export interface ProviderModelOption {
  id: string;
  name: string;
  description?: string;
}

export const aiModelFetcher = {
  async fetchModels(
    provider: AIProvider,
    apiKey: string,
    baseUrl?: string
  ): Promise<ProviderModelOption[]> {
    switch (provider) {
      case "openai":
        return this.fetchOpenAIModels(apiKey, baseUrl);
      case "google":
        return this.fetchGoogleModels(apiKey);
      case "anthropic":
        return this.fetchAnthropicModels(apiKey);
      case "ollama":
        return this.fetchOllamaModels(baseUrl || "http://localhost:11434");
      case "custom":
        return this.fetchOpenAIModels(apiKey, baseUrl);
      default:
        return [];
    }
  },

  async fetchOpenAIModels(apiKey: string, baseUrl?: string): Promise<ProviderModelOption[]> {
    const url = `${baseUrl || "https://api.openai.com/v1"}/models`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        throw new Error(`OpenAI API returned status ${res.status}`);
      }

      const data: any = await res.json();
      if (Array.isArray(data.data)) {
        // Filter to chat models
        return data.data
          .map((m: any) => ({
            id: m.id,
            name: m.id,
          }))
          .filter((m: any) =>
            m.id.includes("gpt") || m.id.includes("o1") || m.id.includes("o3") || m.id.includes("chat")
          )
          .sort((a: any, b: any) => b.id.localeCompare(a.id));
      }
      return [];
    } catch (err: any) {
      console.warn("[aiModelFetcher] Failed to fetch live OpenAI models:", err.message);
      // Sensible fallback list if network is restricted
      return [
        { id: "gpt-4o", name: "GPT-4o (Omni)" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cheap)" },
        { id: "o1", name: "OpenAI o1 (Reasoning)" },
        { id: "o3-mini", name: "OpenAI o3 Mini" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      ];
    }
  },

  async fetchGoogleModels(apiKey: string): Promise<ProviderModelOption[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Google Gemini API returned status ${res.status}`);
      }

      const data: any = await res.json();
      if (Array.isArray(data.models)) {
        return data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => ({
            id: m.name.replace("models/", ""),
            name: m.displayName || m.name,
            description: m.description,
          }));
      }
      return [];
    } catch (err: any) {
      console.warn("[aiModelFetcher] Failed to fetch live Google models:", err.message);
      return [
        { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
        { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Fast)" },
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
        { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
      ];
    }
  },

  async fetchAnthropicModels(_apiKey: string): Promise<ProviderModelOption[]> {
    // Anthropic live model catalog
    return [
      { id: "claude-3-7-sonnet-20250219", name: "Claude 3.7 Sonnet (Hybrid Reasoning)" },
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet v2" },
      { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
    ];
  },

  async fetchOllamaModels(baseUrl: string): Promise<ProviderModelOption[]> {
    const url = `${baseUrl.replace(/\/$/, "")}/api/tags`;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      const data: any = await res.json();
      if (Array.isArray(data.models)) {
        return data.models.map((m: any) => ({
          id: m.name,
          name: m.name,
          description: `Size: ${(m.size / (1024 * 1024 * 1024)).toFixed(1)} GB`,
        }));
      }
      return [];
    } catch {
      return [
        { id: "llama3.2", name: "Llama 3.2" },
        { id: "deepseek-r1", name: "DeepSeek R1" },
        { id: "mistral", name: "Mistral 7B" },
      ];
    }
  },
};
