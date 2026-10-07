"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Bot,
  ShieldCheck,
  Cpu,
  Zap,
} from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";

interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

/** Must match Google API id, e.g. gemini-3.6-flash (not "3.6 flash"). */
function normalizeGeminiModelId(raw: string): string {
  let s = raw.trim().toLowerCase().replace(/^models\//, "");
  if (!s) return s;
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

export default function AISettingsPanel() {
  const { addToast } = useToast();
  const [provider, setProvider] = useState<string>("google");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelId, setCustomModelId] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>("");

  useEffect(() => {
    void loadPanel();
  }, []);

  function applySavedModel(modelId: string, catalog: ModelOption[]) {
    const id = modelId || "gemini-2.5-flash";
    const inCatalog = catalog.some((m) => m.id === id);
    if (inCatalog) {
      setUseCustomModel(false);
      setSelectedModel(id);
      setCustomModelId("");
    } else {
      setUseCustomModel(true);
      setCustomModelId(id);
      setSelectedModel(id);
    }
  }

  const loadPanel = async () => {
    setIsLoadingModels(true);
    let catalog: ModelOption[] = [];
    let savedModel = "gemini-2.5-flash";
    try {
      const [settingsRes, modelsRes] = await Promise.all([
        fetch("/api/ai/settings"),
        fetch("/api/ai/models"),
      ]);
      const settingsData = await settingsRes.json();
      const modelsData = await modelsRes.json();

      if (modelsData.success && Array.isArray(modelsData.models)) {
        catalog = modelsData.models;
        setModels(catalog);
      }

      if (settingsData.success && settingsData.settings) {
        setIsConfigured(settingsData.settings.configured);
        setProvider(settingsData.settings.provider || "google");
        savedModel = settingsData.settings.selectedModel || "gemini-2.5-flash";
        setMaskedKey(settingsData.settings.maskedKey || "");
      }
      applySavedModel(savedModel, catalog);
    } catch (err) {
      console.error("Failed to load AI settings:", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const fetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const res = await fetch("/api/ai/models");
      const data = await res.json();
      if (data.success && Array.isArray(data.models)) {
        setModels(data.models);
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const effectiveModelId = normalizeGeminiModelId(
    (useCustomModel ? customModelId : selectedModel).trim()
  );

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/ai/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          provider: "google",
          selectedModel: effectiveModelId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "Connection Verified",
          message: data.message || "Successfully connected to Google Gemini API.",
          type: "success",
        });
      } else {
        addToast({
          title: "Connection Failed",
          message: data.error || "Gemini authentication failed.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Test Error",
        message: err.message || "Network error while testing credentials.",
        type: "warning",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveModelId) {
      addToast({
        title: "Model required",
        message: "Choose a model from the catalog or enter a custom Gemini model ID.",
        type: "warning",
      });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          apiKey: apiKey || undefined,
          selectedModel: effectiveModelId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast({
          title: "Settings Saved",
          message: "Gemini provider configuration updated and encrypted at rest.",
          type: "accent",
        });
        setApiKey("");
        void loadPanel();
      } else {
        addToast({
          title: "Save Failed",
          message: data.error || "Could not save AI settings.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Save Error",
        message: err.message,
        type: "warning",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div
        className="p-6 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-start justify-between gap-4 shadow-xs"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[var(--nova-ai-subtle)] text-[var(--nova-ai-text)] border border-[var(--nova-ai-border)]">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-[15px] font-semibold text-[var(--nova-text-primary)] tracking-tight">
              Gemini AI Provider Settings
            </h2>
          </div>
          <p className="text-[12px] text-[var(--nova-text-secondary)] leading-relaxed max-w-2xl">
            Configure server-side Google Gemini credentials for high-throughput streaming AI reasoning and
            repository context analysis.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]">
              <AlertCircle className="w-3.5 h-3.5" />
              Not Configured
            </span>
          )}
        </div>
      </div>

      {/* Security & Isolation Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg)] space-y-1.5">
          <div className="flex items-center gap-2 text-[var(--nova-success-text)] text-[11px] font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>AES-256-GCM Encryption</span>
          </div>
          <p className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">
            API keys are encrypted at rest with server-side keys. Raw tokens are never returned to client apps.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg)] space-y-1.5">
          <div className="flex items-center gap-2 text-[var(--nova-info-text)] text-[11px] font-semibold">
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Organization Scoped</span>
          </div>
          <p className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">
            Sessions and keys are strictly partitioned by organization ID to prevent cross-tenant access.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-bg)] space-y-1.5">
          <div className="flex items-center gap-2 text-[var(--nova-ai-text)] text-[11px] font-semibold">
            <Zap className="w-4 h-4 shrink-0" />
            <span>Automated Secret Redaction</span>
          </div>
          <p className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">
            Prompts and attached repository files are scanned to redact tokens, DB strings, and private keys.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSave}
        className="p-6 rounded-xl border border-[var(--nova-border)] bg-[var(--nova-surface)] space-y-6 shadow-xs"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] uppercase tracking-wider mb-2">
              AI Provider
            </label>
            <div className="p-3 rounded-xl border border-[var(--nova-accent-border)] bg-[var(--nova-accent-subtle)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-[var(--nova-accent-text)] shrink-0" />
                <div>
                  <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">Google Gemini</div>
                  <div className="text-[11px] text-[var(--nova-text-secondary)]">
                    Official Google Gen AI SDK (@google/genai)
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] px-2 py-0.5 rounded border border-[var(--nova-accent-border)] shrink-0">
                Active Provider
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] uppercase tracking-wider">
                Default Model
              </label>
              <button
                type="button"
                onClick={fetchModels}
                disabled={isLoadingModels}
                className="text-[11px] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? "animate-spin" : ""}`} />
                Refresh Catalog
              </button>
            </div>
            {!useCustomModel ? (
              <select
                value={models.some((m) => m.id === selectedModel) ? selectedModel : models[0]?.id || "gemini-2.5-flash"}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setUseCustomModel(true);
                    setCustomModelId(selectedModel.startsWith("gemini-") ? selectedModel : "");
                  } else {
                    setSelectedModel(e.target.value);
                  }
                }}
                className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg px-4 py-2.5 text-[12px] text-[var(--nova-text-primary)] focus:outline-none focus:border-[var(--nova-accent)]"
              >
                {(models.length > 0
                  ? models
                  : [
                      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
                      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
                      { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
                      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro" },
                      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash" },
                    ]
                ).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))}
                <option value="__custom__">Custom model ID…</option>
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="Exact id: gemini-3.6-flash"
                  className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg px-4 py-2.5 text-[12px] font-mono text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomModel(false);
                    if (models.some((m) => m.id === customModelId)) {
                      setSelectedModel(customModelId);
                    }
                  }}
                  className="text-[11px] text-[var(--nova-accent-text)] hover:underline"
                >
                  Back to catalog list
                </button>
              </div>
            )}
            <p className="text-[11px] text-[var(--nova-text-muted)] mt-1.5">
              This workspace uses <strong className="font-medium text-[var(--nova-text-secondary)]">Google Gemini only</strong>{" "}
              (not OpenAI/Claude). Save an API key, then use <strong className="font-medium">Refresh Catalog</strong> to load
              all models your key can access, or pick <strong className="font-medium">Custom model ID</strong> to type one.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] uppercase tracking-wider mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--nova-text-muted)]">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={maskedKey ? `Stored key: ${maskedKey}` : "Enter your Google AI Studio API key (AIza...)"}
                className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg pl-10 pr-20 py-2.5 text-[12px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)]"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] rounded-lg hover:bg-[var(--nova-elevated)] transition"
                  title={showApiKey ? "Hide key" : "Show key"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[var(--nova-text-muted)] mt-1.5">
              Get an API key from Google AI Studio (aistudio.google.com). Keys are encrypted before writing to
              database.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--nova-border)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!apiKey && !maskedKey)}
            className="px-4 py-2 rounded-lg text-[12px] font-medium border border-[var(--nova-border)] bg-[var(--nova-bg)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-elevated)] disabled:opacity-50 transition flex items-center gap-2"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--nova-accent-text)]" />
            )}
            Test Connection
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-lg text-[12px] font-semibold bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
