import { aiSettingsService } from "./aiSettingsService";
import { TaskModel } from "../models/Task";
import { SpecModel } from "../models/Spec";
import { SprintModel } from "../models/Sprint";

export const aiService = {
  async chat(organizationId: string, message: string, presetId?: string) {
    const config = await aiSettingsService.getDecryptedApiKey(organizationId);

    // Retrieve live organization context to inject into LLM
    const [tasks, specs, sprint] = await Promise.all([
      TaskModel.find({ organizationId }).limit(20),
      SpecModel.find({ organizationId }).limit(10),
      SprintModel.findOne({ organizationId, status: "active" }),
    ]);

    const urgentTasks = tasks.filter((t) => t.priority === "urgent");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");

    if (!config) {
      // Return workspace summary with instructions to configure their custom LLM
      return {
        success: true,
        configured: false,
        id: `ai-${Date.now()}`,
        provider: "None (Demo workspace analysis)",
        model: "offline-rule-based",
        summary: `Workspace Context: ${tasks.length} tasks, ${specs.length} specs tracked. Configure your OpenAI, Gemini, or Anthropic API key in Settings > AI to enable real LLM reasoning.`,
        bullets: [
          `Active issues: ${tasks.length} total (${urgentTasks.length} urgent, ${inProgressTasks.length} in progress).`,
          `Current sprint: ${sprint ? sprint.name : "No active sprint scheduled"}.`,
          `Specifications: ${specs.length} drafted specifications in repository.`,
          `To unlock autonomous reasoning and RAG vector search, add your API key under Organization Settings.`,
        ],
        citations: urgentTasks.map((t) => ({ key: t.key, title: t.title })),
      };
    }

    const contextPrompt = `
You are the NOVA AI Copilot for this engineering team.
Organization context:
- Active Sprint: ${sprint?.name || "None"} (Goal: ${sprint?.goal || "N/A"})
- Urgent Blockers (${urgentTasks.length}): ${urgentTasks.map((t) => `${t.key}: ${t.title}`).join(", ") || "None"}
- In-Progress Work (${inProgressTasks.length}): ${inProgressTasks.map((t) => `${t.key}: ${t.title}`).join(", ") || "None"}
- Architecture Specs: ${specs.map((s) => `${s.key}: ${s.title} (${s.status})`).join(", ") || "None"}

User Query: "${message || presetId || "Summarize workspace status"}"

Provide a concise, professional engineering response with bulleted action items.
`;

    try {
      const responseText = await this.callLLM(config, contextPrompt);
      const bullets = responseText
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*") || /^\d+\./.test(l.trim()))
        .map((l) => l.replace(/^[-*•\d.]+\s*/, "").trim());

      return {
        success: true,
        configured: true,
        id: `ai-${Date.now()}`,
        provider: config.provider,
        model: config.selectedModel,
        summary: responseText.split("\n")[0].slice(0, 200),
        bullets: bullets.length > 0 ? bullets.slice(0, 5) : [responseText.slice(0, 300)],
        citations: urgentTasks.map((t) => ({ key: t.key, title: t.title })),
      };
    } catch (err: any) {
      console.error("[aiService] LLM invocation failed:", err);
      return {
        success: false,
        error: `Failed to invoke ${config.provider} (${config.selectedModel}): ${err.message}`,
      };
    }
  },

  async generateCode(organizationId: string, specId: string, language: string = "typescript") {
    const config = await aiSettingsService.getDecryptedApiKey(organizationId);
    const spec = await SpecModel.findOne({ organizationId, $or: [{ id: specId }, { key: specId }] });

    if (!spec) throw new Error("Specification not found.");

    if (!config) {
      // Fallback generator when key is not yet set
      const boilerplate = `// Auto-generated ${language} implementation from ${spec.key}: ${spec.title}
// (Configure your AI provider in Settings > AI for full autonomous code generation)

export class ${spec.title.replace(/[^a-zA-Z0-9]/g, "")}Engine {
  private initializedAt = new Date();

  public async execute(): Promise<{ status: string }> {
    console.log("Executing architecture specification: ${spec.key}");
    return { status: "OK" };
  }
}`;
      return {
        success: true,
        configured: false,
        language,
        code: boilerplate,
      };
    }

    const prompt = `
Generate production-ready, clean ${language} code based on this engineering specification:
Title: ${spec.title}
Summary: ${spec.summary}
Requirements / Architecture Content:
${spec.content}

Return ONLY the code without conversational preamble. Include inline documentation and TypeScript types where applicable.
`;

    try {
      const generatedCode = await this.callLLM(config, prompt);
      const cleanCode = generatedCode.replace(/```[a-z]*\n?/gi, "").trim();
      return {
        success: true,
        configured: true,
        language,
        code: cleanCode,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Code generation failed with ${config.provider}: ${err.message}`,
      };
    }
  },

  async callLLM(
    config: { provider: string; apiKey: string; selectedModel: string; baseUrl?: string },
    prompt: string
  ): Promise<string> {
    if (config.provider === "google") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.selectedModel}:generateContent?key=${config.apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!res.ok) {
        const errBody: any = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `Google API status ${res.status}`);
      }

      const data: any = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    }

    if (config.provider === "openai" || config.provider === "custom") {
      const url = `${config.baseUrl || "https://api.openai.com/v1"}/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.selectedModel,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errBody: any = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `OpenAI API status ${res.status}`);
      }

      const data: any = await res.json();
      return data.choices?.[0]?.message?.content || "No response generated.";
    }

    if (config.provider === "anthropic") {
      const url = "https://api.anthropic.com/v1/messages";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.selectedModel,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) {
        const errBody: any = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `Anthropic API status ${res.status}`);
      }

      const data: any = await res.json();
      return data.content?.[0]?.text || "No response generated.";
    }

    if (config.provider === "ollama") {
      const url = `${(config.baseUrl || "http://localhost:11434").replace(/\/$/, "")}/api/generate`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: config.selectedModel,
          prompt,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`Ollama status ${res.status}`);
      const data: any = await res.json();
      return data.response || "No response generated.";
    }

    throw new Error(`Unsupported AI provider: ${config.provider}`);
  },
};
