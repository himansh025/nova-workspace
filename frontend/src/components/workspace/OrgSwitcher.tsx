"use client";

import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import { useAuth } from "@/context/AuthContext";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "Enterprise Scale" | "Pro Team" | "Startup";
  projectsCount: number;
  membersCount: number;
  avatarColor: string;
}

/** Returns the plan pill style based on the plan tier */
const getPlanBadgeClass = (plan: Organization["plan"]) => {
  if (plan === "Enterprise Scale")
    return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]";
  return "bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] border border-[var(--nova-border)]";
};

export const OrgSwitcher: React.FC<{ asMenuItem?: boolean }> = ({ asMenuItem }) => {
  const { user } = useAuth();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  React.useEffect(() => {
    fetch("/api/org/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.organizations && data.organizations.length > 0) {
          const formattedOrgs = data.organizations.map((o: any) => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            plan: o.plan || "Pro Team",
            projectsCount: o.projectsCount || 0,
            membersCount: o.membersCount || 1,
            avatarColor: "bg-indigo-600",
          }));
          setOrganizations(formattedOrgs);

          let savedOrgId = null;
          if (typeof window !== "undefined") {
            savedOrgId = localStorage.getItem("nova_active_org_id");
          }

          const targetOrg =
            formattedOrgs.find((o: any) => o.id === savedOrgId) ||
            formattedOrgs[0];
          setActiveOrg(targetOrg);
          if (typeof window !== "undefined") {
            localStorage.setItem("nova_active_org_id", targetOrg.id);
          }
        }
      });
  }, []);

  const handleSelectOrg = (org: Organization) => {
    setActiveOrg(org);
    setIsDropdownOpen(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("nova_active_org_id", org.id);
      window.dispatchEvent(
        new CustomEvent("nova:org_switched", { detail: org })
      );
      window.location.reload();
    }

    addToast({
      title: "Workspace Switched",
      message: `Switched context to ${org.name} (${org.plan})`,
      type: "accent",
    });
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName }),
      });
      const data = await res.json();

      if (data.success && data.organization) {
        const newOrg: Organization = {
          id: data.organization.id,
          name: data.organization.name,
          slug: data.organization.slug,
          plan: data.organization.plan || "Pro Team",
          projectsCount: 0,
          membersCount: 1,
          avatarColor: "bg-blue-600",
        };

        setOrganizations([...organizations, newOrg]);
        setActiveOrg(newOrg);
        setIsCreateModalOpen(false);
        setNewOrgName("");
        setNewOrgSlug("");

        if (typeof window !== "undefined") {
          localStorage.setItem("nova_active_org_id", newOrg.id);
          window.dispatchEvent(
            new CustomEvent("nova:org_switched", { detail: newOrg })
          );
          window.location.reload();
        }

        addToast({
          title: "New Organization Created",
          message: `${newOrg.name} workspace initialized`,
          type: "success",
        });
      } else {
        addToast({
          title: "Failed to Create Organization",
          message: data.error || "Unknown error",
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
      setIsCreating(false);
    }
  };

  if (!activeOrg) return null;

  return (
    <div className={asMenuItem ? "relative" : "relative mb-3"}>
      {/* ── Trigger Button ── */}
      {asMenuItem ? (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full text-left px-3 py-2 text-[11px] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors flex items-center justify-between"
        >
          <span>Organizations</span>
          <ChevronDown className={`w-3 h-3 text-[var(--nova-text-muted)] transition-all ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`} />
        </button>
      ) : (
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[var(--nova-deep)] hover:bg-[var(--nova-border-muted)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] transition-all duration-150 text-left group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Nova logo mark avatar */}
            <div className="w-6 h-6 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center shrink-0">
              <img
                src="/brand/logo-mark.png"
                alt="Nova Mark"
                className="w-4 h-4 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[12px] font-semibold text-[var(--nova-text-primary)] truncate leading-tight">
                  {activeOrg.name}
                </span>
                {/* Plan badge pill */}
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium leading-none ${getPlanBadgeClass(
                    activeOrg.plan
                  )}`}
                >
                  {activeOrg.plan === "Enterprise Scale" ? "Enterprise" : activeOrg.plan}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[var(--nova-text-muted)] truncate leading-tight mt-0.5">
                {activeOrg.slug}
              </div>
            </div>
          </div>
          <ChevronDown
            className={`w-3 h-3 text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-primary)] shrink-0 transition-all duration-150 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* ── Dropdown ── */}
      {isDropdownOpen && (
        <>
          {/* Backdrop only if not asMenuItem */}
          {!asMenuItem && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}
          <div className={asMenuItem ? 'bg-[var(--nova-deep)] border-y border-[var(--nova-border)] p-1.5' : 'absolute left-0 right-0 mt-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.08)] p-1.5 z-50'}>
            {/* Dropdown header */}
            <div className="px-2 py-1.5 mb-0.5 flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--nova-text-muted)]">
                Organizations
              </span>
              <span className="text-[9px] font-mono bg-[var(--nova-deep)] text-[var(--nova-text-muted)] px-1.5 py-0.5 rounded border border-[var(--nova-border)]">
                Multi-Tenant
              </span>
            </div>

            <div className="border-t border-[var(--nova-border)] pt-1 space-y-px max-h-52 overflow-y-auto">
              {organizations.map((org) => {
                const isSelected = activeOrg.id === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-left transition-all duration-150 group ${
                      isSelected
                        ? "border-l-2 border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] text-[var(--nova-text-primary)] pl-[6px]"
                        : "border-l-2 border-transparent text-[var(--nova-text-secondary)] hover:bg-[var(--nova-deep)] hover:text-[var(--nova-text-primary)] pl-[6px]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Small square org avatar */}
                      <div
                        className="w-5 h-5 rounded-md bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[9px] text-[var(--nova-accent)] font-bold shrink-0"
                      >
                        {org.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-[11px] font-medium truncate ${
                            isSelected ? "text-[var(--nova-text-primary)]" : "text-[var(--nova-text-secondary)] group-hover:text-[var(--nova-text-primary)]"
                          }`}
                        >
                          {org.name}
                        </div>
                        <div className="text-[10px] text-[var(--nova-text-muted)] font-mono">
                          {org.projectsCount} projects · {org.membersCount} members
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3 h-3 text-[var(--nova-accent)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create new org */}
            <div className="pt-1 mt-1 border-t border-[var(--nova-border)]">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[11px] text-[var(--nova-accent)] hover:bg-[var(--nova-accent-subtle)] transition-all duration-150"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Organization</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Create Organization Modal ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] overflow-hidden z-10">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--nova-border)]">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span className="text-[13px] font-semibold text-[var(--nova-text-primary)] tracking-tight">
                  Create Organization Workspace
                </span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orion Labs"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(
                      e.target.value.toLowerCase().replace(/\s+/g, "-")
                    );
                  }}
                  required
                  className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg px-3 py-2 text-[var(--nova-text-primary)] text-[12px] placeholder:text-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] transition-colors duration-150"
                />
              </div>

              {/* Workspace Slug */}
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. orion-labs"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg px-3 py-2 text-[var(--nova-text-secondary)] font-mono text-[12px] placeholder:text-[var(--nova-text-placeholder)] focus:outline-none focus:border-[var(--nova-accent)] transition-colors duration-150"
                />
              </div>

              {/* AI note */}
              <div className="flex items-start gap-3 pl-3 border-l-2 border-[var(--nova-ai)] py-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--nova-ai)] shrink-0 mt-0.5" />
                <span className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">
                  Includes multi-tenant database isolation, custom webhook
                  routing, and RBAC security credentials.
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[12px] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-all duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-3 py-1.5 rounded bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] disabled:opacity-50 text-white text-[12px] font-medium transition-colors duration-150"
                >
                  {isCreating ? "Creating…" : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
