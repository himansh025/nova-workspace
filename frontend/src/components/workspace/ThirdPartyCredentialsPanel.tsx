"use client";

import React, { useState, useEffect } from "react";
import { Mail, Github, Key, CheckCircle2, AlertCircle, Send, Radio, Lock, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";

export default function ThirdPartyCredentialsPanel() {
  const { addToast } = useToast();

  // SMTP state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpFrom, setSmtpFrom] = useState("noreply@nova.app");
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [smtpTestRecipient, setSmtpTestRecipient] = useState("");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [smtpTestStatus, setSmtpTestStatus] = useState<string | null>(null);

  // GitHub state
  const [githubClientId, setGithubClientId] = useState("");
  const [githubClientSecret, setGithubClientSecret] = useState("");
  const [showGithubSecret, setShowGithubSecret] = useState(false);
  const [githubWebhookSecret, setGithubWebhookSecret] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubEnabled, setGithubEnabled] = useState(false);
  const [githubConfigured, setGithubConfigured] = useState(false);
  const [isTestingGithub, setIsTestingGithub] = useState(false);
  const [isSavingGithub, setIsSavingGithub] = useState(false);
  const [githubTestStatus, setGithubTestStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.success && data.settings) {
        const { smtp, github } = data.settings;
        if (smtp) {
          setSmtpConfigured(smtp.configured);
          setSmtpEnabled(smtp.enabled);
          setSmtpHost(smtp.host || "");
          setSmtpPort(smtp.port || 587);
          setSmtpSecure(smtp.secure || false);
          setSmtpUser(smtp.user || "");
          setSmtpFrom(smtp.from || "noreply@nova.app");
          setSmtpTestStatus(smtp.testStatus || null);
        }
        if (github) {
          const hasRealId = Boolean(github.clientId && !github.clientId.startsWith("xxxx"));
          const isReal = Boolean(hasRealId && github.configured);
          setGithubConfigured(isReal);
          setGithubEnabled(Boolean(github.enabled && hasRealId));
          setGithubClientId(hasRealId ? github.clientId : "");
          setGithubRepo(github.repository && github.repository !== "organization/repo" ? github.repository : "");
          setGithubTestStatus(github.testStatus || null);
        }
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSmtp(true);
    try {
      const res = await fetch("/api/integrations/smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          user: smtpUser,
          password: smtpPass || undefined,
          from: smtpFrom,
          enabled: smtpEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "SMTP Configuration Saved",
          message: "Email delivery credentials updated and encrypted with AES-256.",
          type: "accent",
        });
        setSmtpPass("");
        fetchIntegrations();
      } else {
        addToast({ title: "Save Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      addToast({ title: "Save Failed", message: err.message, type: "warning" });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    try {
      const res = await fetch("/api/integrations/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: smtpTestRecipient || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestStatus("passed");
        addToast({
          title: "SMTP Test Passed",
          message: data.message,
          type: "accent",
        });
      } else {
        setSmtpTestStatus("failed");
        addToast({ title: "SMTP Test Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      setSmtpTestStatus("failed");
      addToast({ title: "SMTP Test Failed", message: err.message, type: "warning" });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSaveGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGithub(true);
    try {
      const res = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: githubClientId,
          clientSecret: githubClientSecret || undefined,
          webhookSecret: githubWebhookSecret || undefined,
          repository: githubRepo,
          enabled: githubEnabled,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "GitHub Settings Saved",
          message: "GitHub credentials updated and encrypted with AES-256.",
          type: "accent",
        });
        setGithubClientSecret("");
        setGithubWebhookSecret("");
        fetchIntegrations();
      } else {
        addToast({ title: "Save Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      addToast({ title: "Save Failed", message: err.message, type: "warning" });
    } finally {
      setIsSavingGithub(false);
    }
  };

  const handleTestGithub = async () => {
    setIsTestingGithub(true);
    try {
      const res = await fetch("/api/integrations/github/test", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setGithubTestStatus("passed");
        addToast({
          title: "GitHub Connection Verified",
          message: data.message,
          type: "accent",
        });
      } else {
        setGithubTestStatus("failed");
        addToast({ title: "GitHub Test Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      setGithubTestStatus("failed");
      addToast({ title: "GitHub Test Failed", message: err.message, type: "warning" });
    } finally {
      setIsTestingGithub(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── SMTP Email Configuration ────────────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 text-[var(--nova-text-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">SMTP Email Delivery Service</h3>
              <p className="text-xs text-[var(--nova-text-secondary)]">
                Configure your real mail server for account verification and password reset emails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                smtpConfigured
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {smtpConfigured ? "● SMTP ACTIVE" : "○ SIMULATED (DEV MODE)"}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveSmtp} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">SMTP Host</label>
              <input
                type="text"
                placeholder="e.g. smtp.sendgrid.net, smtp.resend.com, smtp.gmail.com"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">Port</label>
              <input
                type="number"
                placeholder="587"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">SMTP Username / API Key</label>
              <input
                type="text"
                placeholder="e.g. apikey or user@domain.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">SMTP Password</label>
              <div className="relative">
                <input
                  type={showSmtpPass ? "text" : "password"}
                  placeholder="Enter SMTP password or API token..."
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
                >
                  {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">From Address</label>
              <input
                type="text"
                placeholder="noreply@nova.app"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>

            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--nova-text-primary)]">
                <input
                  type="checkbox"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded border-[var(--nova-border)] bg-[var(--nova-bg)] text-[var(--nova-accent)] focus:ring-0"
                />
                <span>Use SSL/TLS (Port 465)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--nova-text-primary)]">
                <input
                  type="checkbox"
                  checked={smtpEnabled}
                  onChange={(e) => setSmtpEnabled(e.target.checked)}
                  className="rounded border-[var(--nova-border)] bg-[var(--nova-bg)] text-emerald-600 focus:ring-0"
                />
                <span>Enable Real Delivery</span>
              </label>
            </div>
          </div>

          {/* Test Email Row */}
          <div className="pt-3 border-t border-[var(--nova-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="Send test email to (e.g. you@domain.com)..."
                value={smtpTestRecipient}
                onChange={(e) => setSmtpTestRecipient(e.target.value)}
                className="px-3 py-1.5 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)] w-full sm:w-64"
              />
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={isTestingSmtp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-all shrink-0 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isTestingSmtp ? "animate-pulse" : ""}`} />
                <span>{isTestingSmtp ? "Sending..." : "Send Test Email"}</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSavingSmtp}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingSmtp ? "Saving Encrypted..." : "Save SMTP Credentials"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ─── GitHub App & Webhook Configuration ─────────────────────────────── */}
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 text-[var(--nova-text-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[var(--nova-accent)]">
              <Github className="w-5 h-5 text-[var(--nova-accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">GitHub OAuth & App Integration</h3>
              <p className="text-xs text-[var(--nova-text-secondary)]">
                Connect your organization to GitHub for real PR diffs, commits, and webhook synchronization.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
              githubConfigured && githubTestStatus === "passed"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : githubConfigured && githubTestStatus === "failed"
                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                : githubConfigured
                ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] border-[var(--nova-border)]"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                githubConfigured && githubTestStatus === "passed"
                  ? "bg-emerald-500 animate-pulse"
                  : githubConfigured && githubTestStatus === "failed"
                  ? "bg-rose-500"
                  : githubConfigured
                  ? "bg-sky-500"
                  : "bg-neutral-400"
              }`}
            />
            {githubConfigured && githubTestStatus === "passed"
              ? "GITHUB CONNECTED & VERIFIED"
              : githubConfigured && githubTestStatus === "failed"
              ? "PROBE FAILED"
              : githubConfigured
              ? "CREDENTIALS CONFIGURED"
              : "GITHUB DISCONNECTED"}
          </span>
        </div>

        <form onSubmit={handleSaveGithub} className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <label className="flex items-center gap-2 text-xs text-[var(--nova-text-primary)] font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={githubEnabled}
                onChange={(e) => setGithubEnabled(e.target.checked)}
                className="rounded border-[var(--nova-border)] bg-[var(--nova-bg)] text-[var(--nova-accent)] focus:ring-0"
              />
              <span>Enable Real GitHub Webhooks & Sync</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">GitHub Client ID</label>
              <input
                type="text"
                placeholder="e.g. Iv1.xxxxxxxxxxxxxxxx"
                value={githubClientId}
                onChange={(e) => setGithubClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">GitHub Client Secret</label>
              <div className="relative">
                <input
                  type={showGithubSecret ? "text" : "password"}
                  placeholder="Enter GitHub App Client Secret..."
                  value={githubClientSecret}
                  onChange={(e) => setGithubClientSecret(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowGithubSecret(!showGithubSecret)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
                >
                  {showGithubSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">Target Repository</label>
              <input
                type="text"
                placeholder="e.g. owner/repo-name"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">Webhook HMAC Secret</label>
              <input
                type="password"
                placeholder="Optional webhook secret for signature verification..."
                value={githubWebhookSecret}
                onChange={(e) => setGithubWebhookSecret(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--nova-border)] flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestGithub}
              disabled={isTestingGithub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-all shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingGithub ? "animate-spin" : ""}`} />
              <span>{isTestingGithub ? "Probing..." : "Test GitHub Connection"}</span>
            </button>

            <button
              type="submit"
              disabled={isSavingGithub}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSavingGithub ? "Saving Encrypted..." : "Save GitHub Credentials"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
