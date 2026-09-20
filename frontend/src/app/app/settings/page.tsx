"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Github,
  GitBranch,
  Key,
  Bell,
  Radio,
  Zap,
  ExternalLink
} from "lucide-react";

import { useToast } from "@/components/workspace/ToastProvider";
import AISettingsPanel from "@/components/workspace/AISettingsPanel";
import ThirdPartyCredentialsPanel from "@/components/workspace/ThirdPartyCredentialsPanel";

export default function SettingsPage() {
  const { addToast } = useToast();
  const [workspaceName, setWorkspaceName] = useState("Nova Engineering Labs");
  const [slug, setSlug] = useState("nova-core");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [githubSync, setGithubSync] = useState(false);
  const [gitlabSync, setGitlabSync] = useState(false);
  const [linearSync, setLinearSync] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [outgoingWebhooks, setOutgoingWebhooks] = useState<any[]>([]);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  const fetchOutgoingWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks/outgoing");
      const data = await res.json();
      if (data.webhooks) setOutgoingWebhooks(data.webhooks);
    } catch {}
  };

  useEffect(() => {
    fetchOutgoingWebhooks();
    fetch("/api/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.github) {
          setGithubSync(Boolean(data.settings.github.configured && data.settings.github.enabled));
        }
      })
      .catch(() => {});
  }, []);

  const handleTestOutgoingWebhook = async (id: string) => {
    setTestingWebhookId(id);
    try {
      const res = await fetch("/api/webhooks/outgoing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", id }),
      });
      const data = await res.json();
      if (data.message) {
        addToast({
          title: "Webhook Delivery Success",
          message: data.message,
          type: "accent",
        });
        fetchOutgoingWebhooks();
      }
    } catch (err) {
      console.error("Test webhook failed", err);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const handleSimulateWebhook = async (event: string) => {
    setIsSimulatingWebhook(true);
    try {
      const randomSha = Math.random().toString(36).substring(2, 9);
      const res = await fetch("/api/webhooks/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, commitSha: randomSha, branch: defaultBranch })
      });
      const data = await res.json();
      if (data.message) {
        addToast({
          title: `GitHub Webhook (${event})`,
          message: data.message,
          type: event === "ci_passed" ? "success" : "commit"
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("task-saved"));
        }
      }
    } catch (err) {
      console.error("Webhook simulation failed", err);
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetData = async () => {
    if (!confirm("Reset all projects, tasks, specs, and releases to initial enterprise demo state?")) {
      return;
    }
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      setResetMessage(data.message || "Database reset successfully.");
      setTimeout(() => setResetMessage(""), 4000);
    } catch (err) {
      console.error("Failed to reset database", err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto text-neutral-200">
      {/* Top Header */}
      <div className="pb-4 border-b border-white/10">
        <h1 className="text-xl sm:text-2xl font-semibold text-white">Workspace Settings</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configure repository links, team synchronization, and database state
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Workspace configuration saved successfully.</span>
        </div>
      )}

      {resetMessage && (
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* General Settings Form */}
      <form onSubmit={handleSaveSettings} className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-5">
        <h3 className="text-sm font-semibold text-white">General Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-neutral-400 text-[11px] mb-1">Workspace Name</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white text-xs focus:outline-hidden focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-neutral-400 text-[11px] mb-1">Organization Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white text-xs font-mono focus:outline-hidden focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-neutral-400 text-[11px] mb-1">Default Git Branch</label>
          <input
            type="text"
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white text-xs font-mono focus:outline-hidden focus:border-[var(--color-accent)] max-w-xs"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </form>

      {/* AI Copilot & Custom LLM Provider Configuration */}
      <AISettingsPanel />

      {/* Third-Party Service Credentials (SMTP Email & GitHub OAuth/Webhooks) */}
      <ThirdPartyCredentialsPanel />

      {/* Git & Tool Integrations */}
      <div className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-5">
        <h3 className="text-sm font-semibold text-white">Git Providers & Sync</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#1B1E28] border border-white/5">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-white" />
              <div>
                <div className="text-xs font-medium text-white">GitHub Enterprise Sync</div>
                <div className="text-[11px] text-neutral-400">
                  Continuous webhook ingestion for issues, PR reviews, and commit SHAs
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!githubSync) {
                  addToast({
                    title: "GitHub Credentials Required",
                    message: "Configure your GitHub Client ID & Secret in the panel below to activate live sync.",
                    type: "warning",
                  });
                } else {
                  setGithubSync(false);
                }
              }}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                githubSync ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-neutral-400 border border-white/10"
              }`}
            >
              {githubSync ? "Connected" : "Disconnected"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#1B1E28] border border-white/5">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-xs font-medium text-white">GitLab Self-Managed</div>
                <div className="text-[11px] text-neutral-400">
                  Pipelines and merge request bidirectional state triggers
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGitlabSync(!gitlabSync)}
              className={`px-3 py-1 rounded text-xs font-mono ${
                gitlabSync ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-neutral-400"
              }`}
            >
              {gitlabSync ? "Connected" : "Disconnected"}
            </button>
          </div>
        </div>

        {/* Live Webhook Simulation Testing Panel */}
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="text-xs font-medium text-white flex items-center gap-2">
            <Github className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Interactive Live Webhook Simulator</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            Simulate real-time git pushes, PR merges, and CI passes to test live state mutations on the Kanban board:
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSimulateWebhook("push")}
              disabled={isSimulatingWebhook}
              className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-neutral-200 transition-colors"
            >
              ⚡ Simulate Git Push
            </button>

            <button
              type="button"
              onClick={() => handleSimulateWebhook("pull_request_merged")}
              disabled={isSimulatingWebhook}
              className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-mono text-emerald-300 transition-colors"
            >
              🔀 Simulate PR Merge
            </button>

            <button
              type="button"
              onClick={() => handleSimulateWebhook("ci_passed")}
              disabled={isSimulatingWebhook}
              className="px-3 py-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-xs font-mono text-blue-300 transition-colors"
            >
              🛡️ Simulate CI Suite Passed
            </button>
          </div>
        </div>
      </div>

      {/* Outgoing Webhook Integrations Hub */}
      <div className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Outgoing Webhook Integrations</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Dispatch realtime workspace events (deployments, spec approvals, PR merges) to external services
            </p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
            HMAC-SHA256 SIGNED
          </span>
        </div>

        <div className="space-y-3">
          {outgoingWebhooks.map((hook) => (
            <div
              key={hook.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#1B1E28] border border-white/5 gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs">{hook.name}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-white/5 text-neutral-400 border border-white/5">
                    {hook.target}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {hook.status}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-neutral-400 truncate max-w-md">
                  {hook.url}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-mono pt-1">
                  <span>Last delivery: {hook.lastDelivery || "N/A"}</span>
                  <span>•</span>
                  <span className="text-emerald-400">{hook.deliverySuccessRate}% Success SLA</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTestOutgoingWebhook(hook.id)}
                disabled={testingWebhookId === hook.id}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-medium transition-all shrink-0 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${testingWebhookId === hook.id ? "animate-pulse" : ""}`} />
                <span>{testingWebhookId === hook.id ? "Sending..." : "Send Test Payload"}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="p-6 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-4">
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Demo State Management</h3>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Reset all task statuses, newly created issues, architecture specs, and release traffic sliders back to the pristine enterprise demo baseline.
        </p>

        <button
          type="button"
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-200 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
          <span>{isResetting ? "Resetting Demo State..." : "Reset to Demo Data"}</span>
        </button>
      </div>
    </div>
  );
}
