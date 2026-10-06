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

export default function AISettingsPanel() {
  const { addToast } = useToast();
  const [provider, setProvider] = useState<string>("google");
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-2.5-flash");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [maskedKey, setMaskedKey] = useState<string>("");

  useEffect(() => {
    fetchSettings();
    fetchModels();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/ai/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setIsConfigured(data.settings.configured);
        setProvider(data.settings.provider || "google");
        setSelectedModel(data.settings.selectedModel || "gemini-2.5-flash");
        setMaskedKey(data.settings.maskedKey || "");
      }
    } catch (err) {
      console.error("Failed to load AI settings:", err);
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

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/ai/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          provider: "google",
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
    setIsSaving(true);
    try {
      const res = await fetch("/api/ai/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          apiKey: apiKey || undefined,
          selectedModel,
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
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-900/20 via-purple-900/10 to-transparent flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Gemini AI Provider Settings</h2>
          </div>
          <p className="text-sm text-neutral-400">
            Configure server-side Google Gemini credentials for high-throughput streaming AI reasoning and repository context analysis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertCircle className="w-3.5 h-3.5" />
              Not Configured
            </span>
          )}
        </div>
      </div>

      {/* Security & Isolation Notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/5 bg-neutral-900/40 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>AES-256-GCM Encryption</span>
          </div>
          <p className="text-xs text-neutral-400">
            API keys are encrypted at rest with server-side keys. Raw tokens are never returned to client apps.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-neutral-900/40 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-medium">
            <Cpu className="w-4 h-4" />
            <span>Organization Scoped</span>
          </div>
          <p className="text-xs text-neutral-400">
            Sessions and keys are strictly partitioned by organization ID to prevent cross-tenant access.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-white/5 bg-neutral-900/40 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
            <Zap className="w-4 h-4" />
            <span>Automated Secret Redaction</span>
          </div>
          <p className="text-xs text-neutral-400">
            Prompts and attached repository files are scanned to redact tokens, DB strings, and private keys.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="p-6 rounded-2xl border border-white/10 bg-neutral-900/30 space-y-6">
        <div className="space-y-4">
          {/* Provider Selection (Gemini Official) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              AI Provider
            </label>
            <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-sm font-medium text-white">Google Gemini</div>
                  <div className="text-xs text-neutral-400">Official Google Gen AI SDK (@google/genai)</div>
                </div>
              </div>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                Active Provider
              </span>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Default Model
              </label>
              <button
                type="button"
                onClick={fetchModels}
                disabled={isLoadingModels}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingModels ? "animate-spin" : ""}`} />
                Refresh Catalog
              </button>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              {models.length > 0 ? (
                models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.id})
                  </option>
                ))
              ) : (
                <>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default fast)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced reasoning)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </>
              )}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={maskedKey ? `Stored key: ${maskedKey}` : "Enter your Google AI Studio API key (AIza...)"}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl pl-10 pr-20 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
              />
              <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
                  title={showApiKey ? "Hide key" : "Show key"}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-1.5">
              Get an API key from Google AI Studio (aistudio.google.com). Keys are encrypted before writing to database.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || (!apiKey && !maskedKey)}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-white/10 bg-neutral-800/80 text-white hover:bg-neutral-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
            Test Connection
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition flex items-center gap-2"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
