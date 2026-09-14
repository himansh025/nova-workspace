"use client";

import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Plus,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { useToast } from "./ToastProvider";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "Enterprise Scale" | "Pro Team" | "Startup";
  projectsCount: number;
  membersCount: number;
  avatarColor: string;
}

const DEFAULT_ORGS: Organization[] = [
  {
    id: "org-1",
    name: "Nova Engineering Labs",
    slug: "nova-core",
    plan: "Enterprise Scale",
    projectsCount: 3,
    membersCount: 5,
    avatarColor: "bg-indigo-600",
  },
  {
    id: "org-2",
    name: "Acme Edge Systems",
    slug: "acme-edge",
    plan: "Pro Team",
    projectsCount: 2,
    membersCount: 4,
    avatarColor: "bg-emerald-600",
  },
  {
    id: "org-3",
    name: "Hyperion Cloud Infra",
    slug: "hyperion-cloud",
    plan: "Enterprise Scale",
    projectsCount: 4,
    membersCount: 8,
    avatarColor: "bg-purple-600",
  },
];

export const OrgSwitcher: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>(DEFAULT_ORGS);
  const [activeOrg, setActiveOrg] = useState<Organization>(DEFAULT_ORGS[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const { addToast } = useToast();

  const handleSelectOrg = (org: Organization) => {
    setActiveOrg(org);
    setIsDropdownOpen(false);
    addToast({
      title: "Workspace Switched",
      message: `Switched context to ${org.name} (${org.plan})`,
      type: "accent",
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("nova:org_switched", { detail: org })
      );
    }
  };

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName,
      slug: newOrgSlug || newOrgName.toLowerCase().replace(/\s+/g, "-"),
      plan: "Pro Team",
      projectsCount: 1,
      membersCount: 1,
      avatarColor: "bg-blue-600",
    };

    setOrganizations([...organizations, newOrg]);
    setActiveOrg(newOrg);
    setIsCreateModalOpen(false);
    setNewOrgName("");
    setNewOrgSlug("");

    addToast({
      title: "New Organization Created",
      message: `${newOrg.name} workspace initialized`,
      type: "success",
    });
  };

  return (
    <div className="relative mb-4">
      {/* Active Org Trigger Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-[#12141A] hover:bg-[#181B24] border border-white/10 transition-colors text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-md ${activeOrg.avatarColor} flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0`}
          >
            {activeOrg.name[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
              <span>{activeOrg.name}</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono truncate">
              {activeOrg.slug} • {activeOrg.plan}
            </div>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0 transition-colors" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute left-0 right-0 mt-1.5 bg-[#161822] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider border-b border-white/5 flex items-center justify-between">
              <span>Organizations</span>
              <span className="text-[9px] bg-white/5 px-1.5 py-0.2 rounded">Multi-Tenant</span>
            </div>

            <div className="py-1 space-y-0.5 max-h-56 overflow-y-auto">
              {organizations.map((org) => {
                const isSelected = activeOrg.id === org.id;
                return (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors text-xs ${
                      isSelected
                        ? "bg-indigo-600/20 text-white"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-5 h-5 rounded ${org.avatarColor} flex items-center justify-center text-[10px] text-white font-bold shrink-0`}
                      >
                        {org.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{org.name}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {org.projectsCount} projects • {org.membersCount} members
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create New Org Action */}
            <div className="pt-1 border-t border-white/5">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Organization</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Organization Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-[#14161D] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-10 text-xs text-neutral-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#171922]">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm text-white">
                  Create Organization Workspace
                </span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orion Labs"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
                  }}
                  required
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. orion-labs"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full bg-[#0B0C0E] border border-white/10 rounded-lg px-3 py-2 text-neutral-300 font-mono text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Includes multi-tenant database isolation, custom webhook routing, and RBAC security credentials.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
