"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Key, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Bot, Server } from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";

interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export default function AISettingsPanel() {
  const { addToast } = useToast();
  const [provider, setProvider] = useState<string>("google");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-1.5-flash");
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/ai/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setIsConfigured(data.settings.configured);
        setProvider(data.settings.provider || "google");
        setSelectedModel(data.settings.selectedModel || "gemini-1.5-flash");
        setMaskedKey(data.settings.maskedKey || "");
        setBaseUrl(data.settings.baseUrl || "");
      }
    } catch (err) {
      console.error("Failed to load AI settings:", err);
    }
  };

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const queryParams = new URLSearchParams({
        provider,
        ...(apiKey ? { apiKey } : {}),
        ...(baseUrl ? { baseUrl } : {}),
      });

      const res = await fetch(`/api/ai/models?${queryParams.toString()}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        // If current selectedModel is not in the list, set to the first one
        if (!data.models.some((m: ModelOption) => m.id === selectedModel)) {
          setSelectedModel(data.models[0].id);
        }
        addToast({
          title: "Models Loaded",
          message: `Retrieved ${data.models.length} live models from ${provider.toUpperCase()}`,
          type: "accent",
        });
      } else {
        addToast({
          title: "Model Query Notice",
          message: data.error || "Could not retrieve models. Check your API key or connection.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Model Fetch Failed",
        message: err.message,
        type: "warning",
      });
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey || undefined,
          selectedModel,
          baseUrl: baseUrl || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addToast({
          title: "AI Configuration Saved",
          message: `Active model set to ${selectedModel} via ${provider.toUpperCase()}`,
          type: "accent",
        });
        setApiKey("");
        fetchSettings();
      } else {
        addToast({
          title: "Save Failed",
          message: data.error || "Could not save AI settings.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Save Failed",
        message: err.message,
        type: "warning",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-[var(--nova-text-primary)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[rgba(139,92,246,0.10)] border border-[rgba(139,92,246,0.25)] text-[#8B5CF6]">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">AI Copilot & LLM Settings</h3>
            <p className="text-xs text-[var(--nova-text-secondary)]">
              Configure your organization&apos;s AI model and API key. Encrypted with AES-256-GCM.
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2.5 py-1 rounded-full border w-fit ${
            isConfigured
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}
        >
          {isConfigured ? "● ACTIVE & ENCRYPTED" : "○ UNCONFIGURED"}
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">LLM Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: "google", label: "Google Gemini", sub: "Gemini 1.5, 2.0" },
              { id: "openai", label: "OpenAI", sub: "GPT-4o, o1, o3" },
              { id: "anthropic", label: "Anthropic", sub: "Claude 3.5, 3.7" },
              { id: "ollama", label: "Ollama / Local", sub: "Llama, DeepSeek" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProvider(p.id);
                  setModels([]);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  provider === p.id
                    ? "bg-[rgba(99,102,241,0.08)] border-[var(--nova-accent)] text-[var(--nova-text-primary)] shadow-xs"
                    : "bg-[var(--nova-bg)] border-[var(--nova-border)] hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
                }`}
              >
                <div className="text-xs font-semibold">{p.label}</div>
                <div className="text-[10px] text-[var(--nova-text-secondary)] mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-[var(--nova-text-secondary)] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[var(--nova-text-secondary)]" />
              <span>{provider === "ollama" ? "API Token (Optional)" : "Secret API Key"}</span>
            </label>
            {maskedKey && (
              <span className="text-[10px] font-mono text-[var(--nova-text-secondary)]">
                Current: <code className="text-emerald-600 font-semibold">{maskedKey}</code>
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              placeholder={maskedKey ? "Leave blank to keep existing key, or enter new key..." : "Enter your API key..."}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full pl-3 pr-10 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
            >
              {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Base URL (for Ollama or custom proxies) */}
        {(provider === "ollama" || provider === "custom") && (
          <div>
            <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-[var(--nova-text-secondary)]" />
              <span>Ollama Host / Base URL</span>
            </label>
            <input
              type="text"
              placeholder="http://localhost:11434"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
            />
          </div>
        )}

        {/* Dynamic Model Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-[var(--nova-text-secondary)] flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-[var(--nova-text-secondary)]" />
              <span>Selected Model</span>
            </label>

            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isLoadingModels}
              className="flex items-center gap-1 text-[11px] text-[var(--nova-accent)] hover:underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingModels ? "animate-spin" : ""}`} />
              <span>{isLoadingModels ? "Querying..." : "Fetch Live Models"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {models.length > 0 ? (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="e.g. gemini-1.5-pro, gpt-4o, claude-3-5-sonnet"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
              />
            )}

            <input
              type="text"
              placeholder="Or type custom model name..."
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
            />
          </div>
          <p className="text-[10px] text-[var(--nova-text-secondary)] mt-1">
            Click &quot;Fetch Live Models&quot; to populate with models currently enabled on your account.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving Encrypted Credentials..." : "Save AI Configuration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
