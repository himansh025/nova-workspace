"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Github,
  Key,
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  GitBranch,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";

interface GitHubRepoItem {
  id: string;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  selectedBranch?: string;
  selected?: boolean;
  htmlUrl: string;
}

interface GitHubBranchItem {
  name: string;
  protected: boolean;
}

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

  // GitHub App state
  const [appConnected, setAppConnected] = useState(false);
  const [appInstallation, setAppInstallation] = useState<any>(null);
  const [appConfiguredOnServer, setAppConfiguredOnServer] = useState(false);
  const [isLoadingAppStatus, setIsLoadingAppStatus] = useState(true);
  const [isConnectingApp, setIsConnectingApp] = useState(false);
  const [isDisconnectingApp, setIsDisconnectingApp] = useState(false);

  // Repository and Branch Selector state
  const [repositories, setRepositories] = useState<GitHubRepoItem[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [isSelectingRepo, setIsSelectingRepo] = useState(false);
  const [branches, setBranches] = useState<GitHubBranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSelectingBranch, setIsSelectingBranch] = useState(false);

  // Legacy PAT state
  const [showLegacyPat, setShowLegacyPat] = useState(false);
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
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const installationId = params.get("installation_id");
    const state = params.get("state");

    if (installationId && state) {
      try {
        const res = await fetch("/api/integrations/github/install-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ installation_id: installationId, state }),
        });
        const data = await res.json();
        if (data.success) {
          addToast({
            title: "GitHub App Connected",
            message: "Your organization has successfully linked the GitHub App installation.",
            type: "accent",
          });
          // Clean URL params
          const newUrl = window.location.pathname + (window.location.search.replace(/[?&]installation_id=[^&]+|[?&]state=[^&]+/g, "") || "");
          window.history.replaceState({}, document.title, newUrl);
          fetchIntegrations();
        } else {
          addToast({
            title: "Installation Failed",
            message: data.error || "Could not link GitHub App.",
            type: "warning",
          });
        }
      } catch (err: any) {
        addToast({
          title: "Installation Error",
          message: err.message,
          type: "warning",
        });
      }
    }
  };

  const fetchIntegrations = async () => {
    setIsLoadingAppStatus(true);
    try {
      const res = await fetch("/api/integrations");
      const data = await res.json();
      if (data.success) {
        // SMTP
        if (data.settings?.smtp) {
          const { smtp } = data.settings;
          setSmtpConfigured(smtp.configured);
          setSmtpEnabled(smtp.enabled);
          setSmtpHost(smtp.host || "");
          setSmtpPort(smtp.port || 587);
          setSmtpSecure(smtp.secure || false);
          setSmtpUser(smtp.user || "");
          setSmtpFrom(smtp.from || "noreply@nova.app");
        }

        // GitHub App
        if (data.githubApp) {
          const { appConfigured, connected, installation, selectedRepository } = data.githubApp;
          setAppConfiguredOnServer(appConfigured);
          setAppConnected(connected);
          setAppInstallation(installation);

          if (connected) {
            fetchRepositories(selectedRepository);
          }
        }

        // Legacy PAT
        if (data.settings?.github) {
          const { github } = data.settings;
          const hasRealId = Boolean(github.clientId && !github.clientId.startsWith("xxxx"));
          setGithubConfigured(Boolean(hasRealId && github.configured));
          setGithubEnabled(Boolean(github.enabled && hasRealId));
          setGithubClientId(hasRealId ? github.clientId : "");
          setGithubRepo(github.repository && github.repository !== "organization/repo" ? github.repository : "");
          setGithubTestStatus(github.testStatus || null);
        }
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setIsLoadingAppStatus(false);
    }
  };

  const fetchRepositories = async (preselectedRepo?: any) => {
    setIsLoadingRepos(true);
    try {
      const res = await fetch("/api/integrations/github/repositories");
      const data = await res.json();
      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);
        const selected =
          preselectedRepo ||
          data.repositories.find((r: GitHubRepoItem) => r.selected) ||
          data.repositories[0];

        if (selected) {
          setSelectedRepoId(selected.id || `repo-${selected.githubRepositoryId}`);
          fetchBranches(selected.id || `repo-${selected.githubRepositoryId}`, selected.selectedBranch || selected.defaultBranch);
        }
      }
    } catch (err) {
      console.error("Failed to fetch repositories:", err);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const fetchBranches = async (repoId: string, currentBranch?: string) => {
    setIsLoadingBranches(true);
    try {
      const res = await fetch(`/api/integrations/github/branches?repositoryId=${encodeURIComponent(repoId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
        setSelectedBranch(currentBranch || data.branches[0]?.name || "main");
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const handleConnectGitHubApp = async () => {
    setIsConnectingApp(true);
    try {
      const res = await fetch("/api/integrations/github/install-url");
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        addToast({
          title: "Connection Failed",
          message: data.error || "GitHub App credentials are not configured on the server.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({ title: "Connection Error", message: err.message, type: "warning" });
    } finally {
      setIsConnectingApp(false);
    }
  };

  const handleDisconnectGitHubApp = async () => {
    if (!confirm("Are you sure you want to disconnect GitHub App for this organization?")) return;
    setIsDisconnectingApp(true);
    try {
      const res = await fetch("/api/integrations/github/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "GitHub App Disconnected",
          message: "Organization's GitHub App installation has been revoked.",
          type: "accent",
        });
        setAppConnected(false);
        setAppInstallation(null);
        setRepositories([]);
        setBranches([]);
        setSelectedRepoId("");
        setSelectedBranch("");
      } else {
        addToast({ title: "Disconnect Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      addToast({ title: "Disconnect Error", message: err.message, type: "warning" });
    } finally {
      setIsDisconnectingApp(false);
    }
  };

  const handleSelectRepository = async (repoIdentifier: string) => {
    const repo = repositories.find((r) => r.id === repoIdentifier || String(r.githubRepositoryId) === repoIdentifier);
    if (!repo) return;

    setIsSelectingRepo(true);
    setSelectedRepoId(repo.id);

    try {
      const res = await fetch("/api/integrations/github/repositories/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepositoryId: repo.githubRepositoryId,
          selectedBranch: repo.selectedBranch || repo.defaultBranch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "Repository Selected",
          message: `Active repository set to ${repo.fullName}`,
          type: "accent",
        });
        fetchBranches(repo.id, repo.selectedBranch || repo.defaultBranch);
      } else {
        addToast({ title: "Selection Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      addToast({ title: "Error", message: err.message, type: "warning" });
    } finally {
      setIsSelectingRepo(false);
    }
  };

  const handleSelectBranch = async (branchName: string) => {
    if (!selectedRepoId) return;
    setIsSelectingBranch(true);
    setSelectedBranch(branchName);

    try {
      const res = await fetch("/api/integrations/github/branches/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryId: selectedRepoId,
          branch: branchName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: "Branch Selected",
          message: `Default tracking branch set to ${branchName}`,
          type: "accent",
        });
      } else {
        addToast({ title: "Branch Selection Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
      addToast({ title: "Error", message: err.message, type: "warning" });
    } finally {
      setIsSelectingBranch(false);
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
        addToast({
          title: "SMTP Test Passed",
          message: data.message,
          type: "accent",
        });
      } else {
        addToast({ title: "SMTP Test Failed", message: data.error, type: "warning" });
      }
    } catch (err: any) {
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
          message: "Legacy GitHub credentials encrypted with AES-256.",
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
      {/* ─── PRIMARY GITHUB APP INTEGRATION ──────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 text-[var(--nova-text-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)] text-[var(--nova-accent)]">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">GitHub App Integration</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[rgba(99,102,241,0.1)] text-[var(--nova-accent)] border border-[rgba(99,102,241,0.2)] font-medium">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
                Connect your GitHub organization via official GitHub App for fine-grained repository access, branch tracking, and cryptographic webhook security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                appConnected
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-neutral-500/10 text-[var(--nova-text-muted)] border-[var(--nova-border)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  appConnected ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"
                }`}
              />
              {appConnected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </div>
        </div>

        {/* GitHub App Connection State Card */}
        {isLoadingAppStatus ? (
          <div className="py-8 text-center text-xs text-[var(--nova-text-muted)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
            <span>Loading GitHub App status...</span>
          </div>
        ) : !appConnected ? (
          <div className="p-4 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-[var(--nova-text-primary)]">No Active GitHub Installation</div>
                <div className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5">
                  Install the Nova GitHub App on your personal account or GitHub Organization to authorize repositories with zero PAT friction.
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnectGitHubApp}
                disabled={isConnectingApp}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Github className="w-4 h-4" />
                <span>{isConnectingApp ? "Connecting..." : "Connect GitHub"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Connected Header Bar */}
            <div className="p-4 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-[var(--nova-text-primary)] flex items-center gap-2">
                    <span>GitHub Connected</span>
                    <span className="font-mono text-[11px] text-[var(--nova-accent)] font-normal">
                      @{appInstallation?.accountLogin || "organization"}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5">
                    Installation ID: <span className="font-mono text-[var(--nova-text-primary)]">{appInstallation?.githubInstallationId}</span> • Status: <span className="text-emerald-600 font-medium">ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://github.com/settings/installations/${appInstallation?.githubInstallationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] hover:bg-[var(--nova-deep)] text-[var(--nova-text-primary)] text-xs font-medium transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Manage</span>
                </a>

                <button
                  type="button"
                  onClick={handleDisconnectGitHubApp}
                  disabled={isDisconnectingApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-600 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>{isDisconnectingApp ? "Disconnecting..." : "Disconnect"}</span>
                </button>
              </div>
            </div>

            {/* Repository & Branch Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Repository Selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Target Repository
                </label>
                {isLoadingRepos ? (
                  <div className="px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-muted)] flex items-center gap-2 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin text-[var(--nova-accent)]" />
                    <span>Loading repositories...</span>
                  </div>
                ) : repositories.length === 0 ? (
                  <div className="px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-muted)] font-mono">
                    No repositories granted to installation.
                  </div>
                ) : (
                  <select
                    value={selectedRepoId}
                    onChange={(e) => handleSelectRepository(e.target.value)}
                    disabled={isSelectingRepo}
                    className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
                  >
                    {repositories.map((repo) => (
                      <option key={repo.id} value={repo.id}>
                        {repo.fullName} {repo.private ? "(Private)" : "(Public)"} — [{repo.defaultBranch}]
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-[var(--nova-text-muted)] mt-1">
                  Selected repository for automated PR ingestion and branch synchronization.
                </p>
              </div>

              {/* Branch Selector */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Default Tracking Branch
                </label>
                {isLoadingBranches ? (
                  <div className="px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-muted)] flex items-center gap-2 font-mono">
                    <RefreshCw className="w-3 h-3 animate-spin text-[var(--nova-accent)]" />
                    <span>Loading branches...</span>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-muted)] font-mono">
                    Select a repository to load branches.
                  </div>
                ) : (
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleSelectBranch(e.target.value)}
                    disabled={isSelectingBranch}
                    className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)]"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} {b.protected ? "🛡️ (Protected)" : ""}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[10px] text-[var(--nova-text-muted)] mt-1">
                  Branch evaluated by webhooks for automatic task transitions when PRs merge.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── LEGACY PAT INTEGRATION ACCORDION (DEPRECATED) ───────────────────── */}
        <div className="pt-2 border-t border-[var(--nova-border)]">
          <button
            type="button"
            onClick={() => setShowLegacyPat(!showLegacyPat)}
            className="w-full flex items-center justify-between text-left text-xs font-medium text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] py-2 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {showLegacyPat ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span>Legacy Personal Access Token (PAT) Configuration</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                DEPRECATED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">
              {githubConfigured ? "Configured" : "Not configured"}
            </span>
          </button>

          {showLegacyPat && (
            <div className="mt-3 p-4 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-4">
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[11px] leading-relaxed">
                <strong>Notice:</strong> Manual PAT configuration is retained for backward compatibility and local developer setups. Production environments should use the GitHub App flow above for automatic token renewal and tenant isolation.
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
                    <span>Enable Legacy GitHub Sync Fallback</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      GitHub Client ID / Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Iv1.xxxxxxxxxxxxxxxx"
                      value={githubClientId}
                      onChange={(e) => setGithubClientId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      Personal Access Token (PAT)
                    </label>
                    <div className="relative">
                      <input
                        type={showGithubSecret ? "text" : "password"}
                        placeholder="Paste PAT (ghp_... or github_pat_...)"
                        value={githubClientSecret}
                        onChange={(e) => setGithubClientSecret(e.target.value)}
                        className="w-full pl-3 pr-10 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
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
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      Target Repository
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. owner/repo-name"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      Webhook HMAC Secret
                    </label>
                    <input
                      type="password"
                      placeholder="Optional webhook secret for signature verification..."
                      value={githubWebhookSecret}
                      onChange={(e) => setGithubWebhookSecret(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--nova-border)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestGithub}
                    disabled={isTestingGithub}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-medium transition-all shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingGithub ? "animate-spin" : ""}`} />
                    <span>{isTestingGithub ? "Probing..." : "Test Connection"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingGithub}
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isSavingGithub ? "Saving Encrypted..." : "Save Legacy Credentials"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ─── SMTP EMAIL CONFIGURATION ────────────────────────────────────────── */}
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 text-[var(--nova-text-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">SMTP Email Delivery Service</h3>
              <p className="text-xs text-[var(--nova-text-secondary)]">
                Configure your mail server for account verification and password reset emails.
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
    </div>
  );
}
