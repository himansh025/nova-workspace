"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Github,
  GitBranch,
  Key,
  Radio,
  Zap,
  Palette,
  Sparkles,
  LayoutGrid,
  Layers,
  Check,
  Sun,
  User,
  Building2,
  Mail,
  Briefcase,
  Plus,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/workspace/ToastProvider";
import AISettingsPanel from "@/components/workspace/AISettingsPanel";
import ThirdPartyCredentialsPanel from "@/components/workspace/ThirdPartyCredentialsPanel";
import { setActiveOrganization, clearActiveOrganization } from "@/lib/activeOrganization";
import {
  useTheme,
  THEME_PRESETS,
  ThemePresetKey,
  SidebarStyle,
  BorderStrength,
  RadiusOption,
  deriveSemanticTokens,
} from "@/context/ThemeContext";
import {
  DEFAULT_SETTINGS_TAB,
  isSettingsTabId,
  settingsTabHref,
  SettingsTabId,
} from "@/lib/settingsTabs";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const {
    themePreset,
    brandColors,
    interfaceCustomization,
    setThemePreset,
    setCustomBrand,
    setCustomInterface,
    resetToDefault,
    applyTheme,
    isDirty,
    derivedTokens,
  } = useTheme();

  const tabFromUrl = searchParams.get("tab");
  const initialTab =
    tabFromUrl && isSettingsTabId(tabFromUrl) ? tabFromUrl : DEFAULT_SETTINGS_TAB;

  const [activeTab, setActiveTab] = useState<SettingsTabId>(initialTab);
  const [showAdvancedHex, setShowAdvancedHex] = useState(false);

  // User Profile state
  const { user, updateProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileRole, setProfileRole] = useState(user?.role || "Individual");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileRole(user.role || "Individual");
    }
  }, [user]);

  const fetchUserOrgs = () => {
    fetch("/api/org/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.organizations)) {
          setUserOrgs(data.organizations);
        }
      })
      .catch(() => {});
  };

  const selectSettingsTab = useCallback(
    (tabId: SettingsTabId) => {
      setActiveTab(tabId);
      router.replace(settingsTabHref(tabId), { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    fetchUserOrgs();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "access") {
      router.replace("/app/team?tab=access", { scroll: false });
      return;
    }
    if (tabParam === "all") {
      router.replace(settingsTabHref(DEFAULT_SETTINGS_TAB), { scroll: false });
      return;
    }
    if (tabParam && isSettingsTabId(tabParam)) {
      setActiveTab(tabParam);
      return;
    }
    setActiveTab(DEFAULT_SETTINGS_TAB);
    router.replace(settingsTabHref(DEFAULT_SETTINGS_TAB), { scroll: false });
  }, [searchParams, router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        name: profileName.trim(),
        role: profileRole.trim() || "Individual",
      });
      if (res.success) {
        addToast({
          title: "Profile Saved",
          message: "Your name and role have been updated.",
          type: "success",
        });
      } else {
        addToast({
          title: "Update Failed",
          message: res.error || "Could not update profile.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Update Failed",
        message: err.message || "Network error",
        type: "warning",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateOrgInSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreatingOrg(true);
    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });
      const data = await res.json();
      if (data.success && data.organization) {
        if (typeof window !== "undefined") {
          setActiveOrganization({
            id: data.organization.id,
            name: data.organization.name,
          });
          window.dispatchEvent(
            new CustomEvent("nova:org_switched", { detail: data.organization })
          );
        }
        addToast({
          title: "Organization Created",
          message: `Workspace "${data.organization.name}" initialized.`,
          type: "success",
        });
        setNewOrgName("");
        setNewOrgSlug("");
        setShowCreateOrg(false);
        fetchUserOrgs();
        window.location.reload();
      } else {
        addToast({
          title: "Failed to Create Organization",
          message: data.error || "Could not create organization",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Failed to Create Organization",
        message: err.message || "Network error",
        type: "warning",
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  // General Org state
  const [workspaceName, setWorkspaceName] = useState("Nova Engineering Labs");
  const [slug, setSlug] = useState("nova-core");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [githubSync, setGithubSync] = useState(false);
  const [gitlabSync, setGitlabSync] = useState(false);
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
    fetch("/api/org")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.organization) {
          setWorkspaceName(data.organization.name || "Nova Engineering Labs");
          setSlug(data.organization.slug || "nova-core");
          if (data.organization.defaultBranch) {
            setDefaultBranch(data.organization.defaultBranch);
          }
        }
      })
      .catch(() => {});
  }, []);

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

  const handleApplyTheme = () => {
    applyTheme();
    addToast({
      title: "Workspace Theme Updated",
      message: `Active theme preset applied: ${themePreset.toUpperCase()}`,
      type: "accent",
    });
  };

  const handleResetTheme = () => {
    resetToDefault();
    addToast({
      title: "Reset to Default Theme",
      message: "Workspace theme restored to Default Electric Indigo.",
      type: "success",
    });
  };

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
      const payload: any = {
        event,
        commitSha: randomSha,
        branch: defaultBranch,
      };

      if (event === "pull_request_merged" || event === "pull_request") {
        payload.taskKey = "NV-851";
        payload.title = "NV-851 Add security headers & edge protection";
        payload.head = "NV-851-edge-headers";
        payload.base = defaultBranch;
        payload.prId = 104;
        payload.prNumber = 104;
      }

      const res = await fetch("/api/webhooks/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.message) {
        addToast({
          title: `GitHub Webhook (${event})`,
          message: data.message,
          type: event === "ci_passed" ? "success" : "commit",
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("task-saved"));
          window.dispatchEvent(new Event("nova:realtime_sync"));
        }
      }
    } catch (err) {
      console.error("Webhook simulation failed", err);
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName, slug: slug, defaultBranch: defaultBranch }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        addToast({ title: "Settings Saved", message: `Organization updated. Default branch: ${defaultBranch}`, type: "success" });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("nova:realtime_sync"));
        }
      } else {
        addToast({ title: "Update Failed", message: data.error, type: "warning" });
      }
    } catch (err) {
      addToast({ title: "Update Failed", message: "Network error", type: "warning" });
    }
  };

  const handleDeleteOrganization = async () => {
    if (!confirm(`Are you absolutely sure you want to delete ${workspaceName}? This action cannot be undone.`)) return;
    try {
      const res = await fetch("/api/org", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (typeof window !== "undefined") {
          clearActiveOrganization();
          window.location.reload();
        }
      } else {
        addToast({ title: "Delete Failed", message: data.error || "Could not delete organization", type: "warning" });
      }
    } catch (err) {
      addToast({ title: "Delete Failed", message: "Network error", type: "warning" });
    }
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

  const tabs = [
    { id: "profile", label: "Profile & Role", icon: User },
    { id: "appearance", label: "Appearance & Theme", icon: Palette },
    { id: "general", label: "General & Org", icon: Settings },
    { id: "ai", label: "AI Copilot", icon: Sparkles },
    { id: "credentials", label: "Credentials & Keys", icon: Key },
    { id: "integrations", label: "Git & Webhooks", icon: GitBranch },
    { id: "danger", label: "System Reset", icon: AlertTriangle },
  ];

  const presetList: { key: ThemePresetKey; name: string; subtitle: string }[] = [
    { key: "nova", name: "Nova", subtitle: "Electric Indigo" },
    { key: "professional", name: "Professional", subtitle: "Cool Slate" },
    { key: "ocean", name: "Ocean", subtitle: "Sky & Cyan" },
    { key: "forest", name: "Forest", subtitle: "Emerald & Sage" },
    { key: "violet", name: "Violet", subtitle: "Lavender & Violet" },
  ];

  return (
    <div className="min-h-screen bg-[var(--nova-bg)] text-[var(--nova-text-primary)] transition-colors duration-150">
      {/* Top Header & Navigation Tabs */}
      <div className="border-b border-[var(--nova-border)] bg-[var(--nova-surface)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div>
              <h1 className="text-[15px] sm:text-lg font-semibold tracking-tight text-[var(--nova-text-primary)] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--nova-accent)]" />
                <span>Workspace Settings</span>
              </h1>
              <p className="text-[12px] text-[var(--nova-text-muted)] mt-0.5">
                Customize workspace appearance, manage API credentials, repository sync, and workspace state
              </p>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectSettingsTab(tab.id as SettingsTabId)}
                  className={`flex items-center gap-2 px-3 py-2 text-[12px] whitespace-nowrap transition-colors duration-150 border-b-2 cursor-pointer ${
                    isActive
                      ? "border-b-2 border-[var(--nova-accent)] text-[var(--nova-text-primary)] font-medium bg-[var(--nova-accent-subtle)]/40 rounded-t-md"
                      : "border-transparent text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--nova-accent)]" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {savedSuccess && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Workspace configuration saved successfully.</span>
          </div>
        )}

        {resetMessage && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* ─── TAB 0: User Profile & Role ────────────────────────── */}
        {(activeTab === "profile") && (
          <div className="space-y-6">
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--nova-border)]">
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--nova-text-primary)] flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--nova-accent)]" />
                    <span>Personal Profile & Engineering Role</span>
                  </h2>
                  <p className="text-[12px] text-[var(--nova-text-muted)] mt-0.5">
                    Customize your display name and engineering title. Roles are visible across task assignments and PR reviews.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]">
                  {userOrgs.length > 0 ? "Organization Member" : "Individual Developer"}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 max-w-xl">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-[var(--nova-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-muted)] text-[12px] cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[var(--nova-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)]">
                      Engineering Role
                    </label>
                    <span className="text-[10px] text-[var(--nova-text-muted)]">
                      Select below or enter custom title
                    </span>
                  </div>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--nova-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Staff Backend Engineer"
                      value={profileRole}
                      onChange={(e) => setProfileRole(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Individual Contributor",
                      "Staff Backend Engineer",
                      "Staff Frontend Engineer",
                      "Full Stack Developer",
                      "Lead Architect",
                      "DevOps & SRE",
                      "Engineering Manager",
                      "Security Lead",
                      "Product Manager",
                      "Software Engineer",
                    ].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setProfileRole(r)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          profileRole === r
                            ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] text-[var(--nova-accent)] font-medium"
                            : "bg-[var(--nova-deep)] border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[12px] font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Organizations Section inside Profile Tab */}
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--nova-border)]">
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--nova-text-primary)] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[var(--nova-accent)]" />
                    <span>Organizations & Workspaces</span>
                  </h2>
                  <p className="text-[12px] text-[var(--nova-text-muted)] mt-0.5">
                    Create or manage multi-tenant engineering workspaces and organizations
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateOrg(!showCreateOrg)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[11px] font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showCreateOrg ? "Cancel" : "Create Organization"}</span>
                </button>
              </div>

              {userOrgs.length === 0 && (
                <div className="mt-4 p-4 rounded-xl bg-[var(--nova-deep)] border border-[var(--nova-border)] flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[var(--nova-accent)] shrink-0 mt-0.5" />
                  <div className="text-[12px] space-y-1">
                    <div className="font-semibold text-[var(--nova-text-primary)]">
                      Individual Account
                    </div>
                    <div className="text-[var(--nova-text-secondary)] leading-relaxed">
                      You are currently registered as an individual. When you need team collaboration, Kanban sprints, or webhook integrations, you can create your organization below.
                    </div>
                  </div>
                </div>
              )}

              {userOrgs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {userOrgs.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[11px] font-bold text-[var(--nova-accent)]">
                          {org.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">
                            {org.name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--nova-text-muted)]">
                            {org.slug} · Role: {org.role || "Member"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showCreateOrg && (
                <form
                  onSubmit={handleCreateOrgInSettings}
                  className="mt-4 p-4 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-accent-border)] space-y-3 max-w-xl"
                >
                  <div className="text-[12px] font-semibold text-[var(--nova-text-primary)] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                    <span>Create Organization</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Engineering Labs"
                      value={newOrgName}
                      onChange={(e) => {
                        setNewOrgName(e.target.value);
                        setNewOrgSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                      Workspace Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. acme-engineering-labs"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] font-mono text-[11px] focus:outline-none focus:border-[var(--nova-accent)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCreateOrg(false)}
                      className="px-3 py-1.5 rounded-lg text-[11px] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingOrg}
                      className="px-3.5 py-1.5 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[11px] font-medium disabled:opacity-50 cursor-pointer"
                    >
                      {isCreatingOrg ? "Creating..." : "Create Organization"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 1: Appearance & Theme Customization ────────────────────────── */}
        {(activeTab === "appearance") && (
          <div className="space-y-6">
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl p-6 space-y-6 shadow-sm">
              {/* Header Bar with Action Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)]">
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--nova-text-primary)] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[var(--nova-accent)]" />
                    <span>Appearance & Accent Customization</span>
                  </h3>
                  <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
                    Select a theme preset or customize your workspace accent color while maintaining optimal dark mode contrast.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isDirty && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Unsaved Changes
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetTheme}
                    className="px-3 py-1.5 rounded-lg border border-[var(--nova-border)] bg-[var(--nova-bg)] hover:bg-[var(--nova-elevated)] text-[var(--nova-text-primary)] text-[12px] font-medium transition-colors cursor-pointer"
                  >
                    Reset to Default
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTheme}
                    className="px-4 py-1.5 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[12px] font-medium transition-colors shadow-sm cursor-pointer"
                  >
                    Apply Theme
                  </button>
                </div>
              </div>

              {/* Clean Single Panel Layout */}
              <div className="space-y-6 max-w-4xl">
                {/* 1. Theme Presets Grid */}
                <div className="space-y-3">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                    Theme Presets
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {presetList.map((p) => {
                      const isSelected = themePreset === p.key;
                      const presetDef = THEME_PRESETS[p.key === "custom" ? "nova" : p.key] || THEME_PRESETS.nova;

                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setThemePreset(p.key)}
                          className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between space-y-2.5 relative cursor-pointer ${
                            isSelected
                              ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] shadow-sm"
                              : "bg-[var(--nova-bg)] border-[var(--nova-border)] hover:border-[var(--nova-border-strong)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-[var(--nova-text-primary)]">
                              {p.name}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                            )}
                          </div>

                          <div className="text-[10px] text-[var(--nova-text-muted)]">
                            {p.subtitle}
                          </div>

                          {/* Swatch preview */}
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-xs" style={{ backgroundColor: presetDef.brand.primary }} title="Primary Color" />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-xs" style={{ backgroundColor: presetDef.brand.accent }} title="Accent Color" />
                            <span className="w-3.5 h-3.5 rounded-full border border-white/10 shadow-xs" style={{ backgroundColor: presetDef.brand.ai }} title="AI Copilot Color" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Brand Accent Customization */}
                <div className="space-y-3 pt-4 border-t border-[var(--nova-border)]">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                    Primary Brand Color
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Quick Swatch Options */}
                    {[
                      { name: "Indigo", color: "#6366F1" },
                      { name: "Blue", color: "#3B82F6" },
                      { name: "Teal", color: "#0D9488" },
                      { name: "Emerald", color: "#10B981" },
                      { name: "Amber", color: "#F59E0B" },
                      { name: "Violet", color: "#8B5CF6" },
                      { name: "Rose", color: "#F43F5E" },
                    ].map((swatch) => (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => setCustomBrand({ primary: swatch.color })}
                        className={`px-3 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-2 transition-all cursor-pointer ${
                          brandColors.primary.toLowerCase() === swatch.color.toLowerCase()
                            ? "border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] text-[var(--nova-text-primary)]"
                            : "border-[var(--nova-border)] bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: swatch.color }} />
                        <span>{swatch.name}</span>
                      </button>
                    ))}

                    {/* Custom Hex Picker */}
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="color"
                        value={brandColors.primary}
                        onChange={(e) => setCustomBrand({ primary: e.target.value })}
                        className="w-7 h-7 rounded-md border border-[var(--nova-border)] cursor-pointer bg-transparent shrink-0"
                      />
                      <input
                        type="text"
                        value={brandColors.primary}
                        onChange={(e) => setCustomBrand({ primary: e.target.value })}
                        className="w-24 px-2.5 py-1 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[11px] font-mono focus:border-[var(--nova-accent)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Live Context Preview Bar */}
                <div className="p-4 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-3">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)] flex items-center justify-between">
                    <span>Live Accent Preview</span>
                    <span className="text-[var(--nova-accent)] font-semibold">Active Token: var(--nova-accent)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-[var(--nova-accent)] text-white text-[12px] font-medium shadow-xs"
                    >
                      Primary Action Button
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] text-[var(--nova-accent-text)] text-[12px] font-medium"
                    >
                      Soft Accent Badge
                    </button>
                    <span className="text-[12px] font-medium underline text-[var(--nova-accent)] cursor-pointer">
                      Interactive Link Text
                    </span>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)] ml-auto">
                      Status: Healthy
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: General & Organization Settings ────────────────────────── */}
        {(activeTab === "general") && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 space-y-5"
          >
            <div className="pb-3 border-b border-[var(--nova-border)] flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)]">General Information</h3>
              <span className="text-[11px] text-[var(--nova-text-muted)] font-mono">Organization details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-muted)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-muted)] mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] font-mono focus:outline-none focus:border-[var(--nova-accent)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--nova-text-muted)] mb-1">
                Default Git Branch
              </label>
              <input
                type="text"
                value={defaultBranch}
                onChange={(e) => setDefaultBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] font-mono focus:outline-none focus:border-[var(--nova-accent)] max-w-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-[var(--nova-border)]">
              <button
                type="button"
                onClick={handleDeleteOrganization}
                className="px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[12px] font-medium border border-rose-500/20 transition-colors"
              >
                Delete Organization
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[12px] font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* ─── TAB 3: AI Copilot Settings ────────────────────────────────────── */}
        {(activeTab === "ai") && <AISettingsPanel />}

        {/* ─── TAB 4: Credentials & Keys ─────────────────────────────────────── */}
        {(activeTab === "credentials") && <ThirdPartyCredentialsPanel />}

        {/* ─── TAB 5: Git Providers & Webhooks Hub ───────────────────────────── */}
        {(activeTab === "integrations") && (
          <div className="space-y-6">
            {/* Git Providers */}
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 space-y-5">
              <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)]">Git Providers & Sync</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)]">
                  <div className="flex items-center gap-3">
                    <Github className="w-5 h-5 text-[var(--nova-text-primary)]" />
                    <div>
                      <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">
                        GitHub Enterprise Sync
                      </div>
                      <div className="text-[11px] text-[var(--nova-text-muted)]">
                        Continuous webhook ingestion for issues, PR reviews, and commit SHAs
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("credentials");
                      addToast({
                        title: "GitHub App Management",
                        message: "Manage your GitHub App connection and repository selection in the Credentials tab.",
                        type: "accent",
                      });
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      githubSync
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-[var(--nova-surface)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]"
                    }`}
                  >
                    {githubSync ? "Connected (Manage)" : "Configure"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)]">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">
                        GitLab Self-Managed
                      </div>
                      <div className="text-[11px] text-[var(--nova-text-muted)]">
                        Pipelines and merge request bidirectional state triggers
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGitlabSync(!gitlabSync)}
                    className={`px-3 py-1 rounded text-[11px] font-mono transition-colors ${
                      gitlabSync
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-[var(--nova-surface)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]"
                    }`}
                  >
                    {gitlabSync ? "Connected" : "Disconnected"}
                  </button>
                </div>
              </div>

              {/* Webhook Simulator */}
              <div className="pt-3 border-t border-[var(--nova-border)] space-y-3">
                <div className="text-[12px] font-medium text-[var(--nova-text-primary)] flex items-center gap-2">
                  <Github className="w-4 h-4 text-[var(--nova-accent)]" />
                  <span>Interactive Live Webhook Simulator</span>
                </div>
                <p className="text-[11px] text-[var(--nova-text-muted)]">
                  Simulate real-time git pushes, PR merges, and CI passes to test live state mutations on Kanban board:
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateWebhook("push")}
                    disabled={isSimulatingWebhook}
                    className="px-3 py-1.5 rounded bg-[var(--nova-bg)] hover:bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[12px] font-mono text-[var(--nova-text-primary)] transition-colors"
                  >
                    ⚡ Simulate Git Push
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateWebhook("pull_request_merged")}
                    disabled={isSimulatingWebhook}
                    className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[12px] font-mono text-emerald-600 dark:text-emerald-300 transition-colors"
                  >
                    🔀 Simulate PR Merge
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateWebhook("ci_passed")}
                    disabled={isSimulatingWebhook}
                    className="px-3 py-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[12px] font-mono text-blue-600 dark:text-blue-300 transition-colors"
                  >
                    🛡️ Simulate CI Suite Passed
                  </button>
                </div>
              </div>
            </div>

            {/* Outgoing Webhooks Hub */}
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Outgoing Webhook Integrations</span>
                  </h3>
                  <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
                    Dispatch realtime workspace events (deployments, spec approvals, PR merges) to external services
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
                  HMAC-SHA256 SIGNED
                </span>
              </div>

              <div className="space-y-3">
                {outgoingWebhooks.map((hook) => (
                  <div
                    key={hook.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--nova-text-primary)] text-[12px]">
                          {hook.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-[var(--nova-surface)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]">
                          {hook.target}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          {hook.status}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--nova-text-muted)] truncate max-w-md">
                        {hook.url}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-[var(--nova-text-muted)] font-mono pt-0.5">
                        <span>Last delivery: {hook.lastDelivery || "N/A"}</span>
                        <span>•</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {hook.deliverySuccessRate}% Success SLA
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTestOutgoingWebhook(hook.id)}
                      disabled={testingWebhookId === hook.id}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-accent-subtle)] hover:bg-[var(--nova-accent-subtle)]/80 border border-[var(--nova-accent-border)] text-[var(--nova-accent-text)] text-[12px] font-medium transition-all shrink-0 disabled:opacity-50"
                    >
                      <Radio className={`w-3.5 h-3.5 ${testingWebhookId === hook.id ? "animate-pulse" : ""}`} />
                      <span>{testingWebhookId === hook.id ? "Sending..." : "Send Test Payload"}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 6: Danger Zone / Reset State ───────────────────────────────── */}
        {(activeTab === "danger") && (
          <div className="bg-[var(--nova-surface)] border border-rose-500/30 rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-[13px] font-medium">System Reset Actions</h3>
            </div>

            <p className="text-[12px] text-[var(--nova-text-muted)] leading-relaxed">
              Reset all task statuses, newly created issues, architecture specs, and release traffic sliders back to the pristine enterprise demo baseline.
            </p>

            <button
              type="button"
              onClick={handleResetData}
              disabled={isResetting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[12px] font-medium transition-colors disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
              <span>{isResetting ? "Resetting Demo State..." : "Reset to Demo Data"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
