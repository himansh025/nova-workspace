"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Building2,
  Mail,
  Shield,
  Briefcase,
  Plus,
  Check,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "./ToastProvider";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_ROLES = [
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
];

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Organizations
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  // Create Org inside Profile
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setRole(user.role || "Individual");
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadOrganizations();
    }
  }, [isOpen]);

  const loadOrganizations = async () => {
    setIsLoadingOrgs(true);
    try {
      const res = await fetch("/api/org/list");
      const data = await res.json();
      if (data.success && Array.isArray(data.organizations)) {
        setUserOrgs(data.organizations);
        const savedId = typeof window !== "undefined" ? localStorage.getItem("nova_active_org_id") : null;
        setActiveOrgId(savedId || (data.organizations[0] ? data.organizations[0].id : null));
      } else {
        setUserOrgs([]);
      }
    } catch {
      setUserOrgs([]);
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingProfile(true);

    try {
      const res = await updateProfile({
        name: name.trim(),
        role: role.trim() || "Individual",
      });

      if (res.success) {
        addToast({
          title: "Profile Updated",
          message: "Your name and role have been saved successfully.",
          type: "success",
        });
      } else {
        addToast({
          title: "Update Failed",
          message: res.error || "Could not save profile changes.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Update Failed",
        message: err.message || "Network error.",
        type: "warning",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
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
        const created = data.organization;
        if (typeof window !== "undefined") {
          localStorage.setItem("nova_active_org_id", created.id);
          window.dispatchEvent(
            new CustomEvent("nova:org_switched", { detail: created })
          );
        }

        addToast({
          title: "Organization Created",
          message: `Workspace "${created.name}" is now active.`,
          type: "success",
        });

        setShowCreateOrg(false);
        setNewOrgName("");
        setNewOrgSlug("");
        onClose();
        // Reload to load active workspace context cleanly
        window.location.reload();
      } else {
        addToast({
          title: "Failed to Create Organization",
          message: data.error || "Unknown error occurred.",
          type: "warning",
        });
      }
    } catch (err: any) {
      addToast({
        title: "Failed to Create Organization",
        message: err.message || "Network error.",
        type: "warning",
      });
    } finally {
      setIsCreatingOrg(false);
    }
  };

  const handleSwitchOrg = (orgId: string, orgName: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("nova_active_org_id", orgId);
      window.dispatchEvent(
        new CustomEvent("nova:org_switched", { detail: { id: orgId, name: orgName } })
      );
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-2xl shadow-[0_24px_48px_rgba(0,0,0,0.2)] overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nova-border)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[var(--nova-accent)] font-bold text-xs">
              {user?.initials || "U"}
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--nova-text-primary)] leading-tight">
                Profile & Account Settings
              </h2>
              <p className="text-[11px] text-[var(--nova-text-muted)]">
                Manage your personal role, identity, and organizations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* ── Section 1: User Profile & Role ── */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--nova-border)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                Personal Identity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]">
                {userOrgs.length > 0 ? "Organization Member" : "Individual Developer"}
              </span>
            </div>

            {/* Email (Read-only) */}
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

            {/* Full Name */}
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                />
              </div>
            </div>

            {/* Role (Editable!) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)]">
                  Engineering Role
                </label>
                <span className="text-[10px] text-[var(--nova-text-muted)]">
                  Select or type custom role
                </span>
              </div>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 text-[var(--nova-text-muted)] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Staff Backend Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                />
              </div>

              {/* Quick Role Suggestions */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                      role === r
                        ? "bg-[var(--nova-accent-subtle)] border-[var(--nova-accent)] text-[var(--nova-accent)] font-medium"
                        : "bg-[var(--nova-deep)] border-[var(--nova-border)] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:border-[var(--nova-border-muted)]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[12px] font-medium shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isSavingProfile ? "Saving Profile..." : "Save Profile Changes"}
              </button>
            </div>
          </form>

          {/* ── Section 2: Organization Management ── */}
          <div className="space-y-3 pt-3 border-t border-[var(--nova-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                  Organizations
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateOrg(!showCreateOrg)}
                className="text-[11px] text-[var(--nova-accent)] hover:text-[var(--nova-accent-hover)] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showCreateOrg ? "Cancel" : "Create Organization"}</span>
              </button>
            </div>

            {/* If user has no organizations yet */}
            {userOrgs.length === 0 && !isLoadingOrgs && (
              <div className="p-3.5 rounded-xl bg-[var(--nova-deep)] border border-[var(--nova-border)] flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[var(--nova-accent)] shrink-0 mt-0.5" />
                <div className="text-[11px] space-y-1">
                  <div className="font-semibold text-[var(--nova-text-primary)]">
                    Individual Account
                  </div>
                  <div className="text-[var(--nova-text-secondary)] leading-relaxed">
                    You are registered as an individual. When you're ready to collaborate with colleagues, track shared sprints, or configure deployment mesh, create an organization below.
                  </div>
                </div>
              </div>
            )}

            {/* List existing user organizations */}
            {userOrgs.length > 0 && (
              <div className="space-y-1.5">
                {userOrgs.map((org) => {
                  const isActive = activeOrgId === org.id;
                  return (
                    <div
                      key={org.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-[var(--nova-accent-subtle)]/50 border-[var(--nova-accent)] text-[var(--nova-text-primary)]"
                          : "bg-[var(--nova-bg)] border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:border-[var(--nova-border-muted)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[10px] font-bold text-[var(--nova-accent)] shrink-0">
                          {org.name[0]?.toUpperCase() || "O"}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-[var(--nova-text-primary)] truncate">
                            {org.name}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--nova-text-muted)]">
                            {org.slug} · {org.role || "Member"}
                          </div>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSwitchOrg(org.id, org.name)}
                          className="text-[11px] px-2.5 py-1 rounded bg-[var(--nova-deep)] hover:bg-[var(--nova-border)] text-[var(--nova-text-primary)] transition-colors cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Org Form in Profile */}
            {showCreateOrg && (
              <form
                onSubmit={handleCreateOrg}
                className="p-4 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-accent-border)] space-y-3 mt-2"
              >
                <div className="text-[12px] font-semibold text-[var(--nova-text-primary)] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                  <span>Create New Organization</span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Engineering"
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      setNewOrgSlug(
                        e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
                      );
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-[12px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    Workspace Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acme-engineering"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] font-mono text-[11px] focus:outline-none focus:border-[var(--nova-accent)] transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingOrg}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingOrg ? "Creating..." : "Create Organization"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
