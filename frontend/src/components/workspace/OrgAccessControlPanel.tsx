"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, Save, Users } from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";
import { useOrgPermissions } from "@/hooks/useOrgPermissions";

type OrgRole = "owner" | "admin" | "member" | "viewer";

type PermissionId =
  | "project:write"
  | "task:create"
  | "task:update"
  | "task:delete"
  | "team:manage"
  | "spec:create"
  | "spec:update"
  | "spec:approve"
  | "sprint:create"
  | "sprint:update"
  | "release:create"
  | "release:deploy"
  | "integration:manage"
  | "ai:use"
  | "ai:manage"
  | "organization:manage"
  | "billing:manage";

interface CatalogEntry {
  id: PermissionId;
  label: string;
}

interface OrgMemberRow {
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  permissionGrants: PermissionId[];
  permissionRevokes: PermissionId[];
}

const ROLE_BASE: Record<Exclude<OrgRole, "owner">, PermissionId[]> = {
  admin: [
    "project:write",
    "task:create",
    "task:update",
    "task:delete",
    "team:manage",
    "spec:create",
    "spec:update",
    "spec:approve",
    "sprint:create",
    "sprint:update",
    "release:create",
    "release:deploy",
    "integration:manage",
    "ai:use",
    "ai:manage",
  ],
  member: [
    "task:create",
    "task:update",
    "spec:create",
    "spec:update",
    "sprint:update",
    "release:create",
    "ai:use",
  ],
  viewer: [],
};

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const orgId = localStorage.getItem("nova_active_org_id");
    const token = localStorage.getItem("nova_token");
    if (orgId) headers["x-organization-id"] = orgId;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function effectiveSet(member: OrgMemberRow): Set<PermissionId> {
  if (member.role === "owner") return new Set<PermissionId>();
  const base = new Set(ROLE_BASE[member.role] || []);
  member.permissionGrants.forEach((p) => base.add(p));
  member.permissionRevokes.forEach((p) => base.delete(p));
  return base;
}

function overridesFromDesired(
  role: Exclude<OrgRole, "owner">,
  desired: Set<PermissionId>,
  catalog: PermissionId[]
) {
  const base = new Set(ROLE_BASE[role] || []);
  const grants: PermissionId[] = [];
  const revokes: PermissionId[] = [];
  for (const p of catalog) {
    const inBase = base.has(p);
    const want = desired.has(p);
    if (want && !inBase) grants.push(p);
    if (!want && inBase) revokes.push(p);
  }
  return { permissionGrants: grants, permissionRevokes: revokes };
}

export default function OrgAccessControlPanel() {
  const { addToast } = useToast();
  const { can, isOwner, loading: permLoading } = useOrgPermissions();
  const canManageOrg = can("organization:manage");

  const [members, setMembers] = useState<OrgMemberRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [ownerOnly, setOwnerOnly] = useState<CatalogEntry[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<OrgRole>("member");
  const [draftPerms, setDraftPerms] = useState<Set<PermissionId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const catalogIds = useMemo(
    () => [...catalog.map((c) => c.id), ...ownerOnly.map((c) => c.id)],
    [catalog, ownerOnly]
  );

  const load = useCallback(async () => {
    try {
      const headers = buildHeaders();
      const [membersRes, catalogRes] = await Promise.all([
        fetch("/api/org/members", { headers, credentials: "include" }),
        fetch("/api/org/permissions/catalog", { headers, credentials: "include" }),
      ]);
      const membersData = await membersRes.json();
      const catalogData = await catalogRes.json();
      if (membersData.members) {
        setMembers(membersData.members);
        const first = membersData.members.find((m: OrgMemberRow) => m.role !== "owner");
        if (first && !selectedUserId) {
          setSelectedUserId(first.userId);
        }
      }
      if (catalogData.grantable) setCatalog(catalogData.grantable);
      if (catalogData.ownerOnly) setOwnerOnly(catalogData.ownerOnly);
    } catch {
      addToast({ title: "Error", message: "Could not load access control data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (canManageOrg) void load();
    else setLoading(false);
  }, [canManageOrg, load]);

  const selected = members.find((m) => m.userId === selectedUserId) || null;

  useEffect(() => {
    if (!selected || selected.role === "owner") return;
    setDraftRole(selected.role);
    setDraftPerms(effectiveSet(selected));
  }, [selected]);

  const togglePerm = (id: PermissionId) => {
    setDraftPerms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selected || selected.role === "owner") return;
    setSaving(true);
    try {
      const role = draftRole as Exclude<OrgRole, "owner">;
      const { permissionGrants, permissionRevokes } = overridesFromDesired(
        role,
        draftPerms,
        catalogIds
      );
      const headers = buildHeaders();
      const res = await fetch(`/api/org/members/${selected.userId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: isOwner ? draftRole : undefined,
          permissionGrants,
          permissionRevokes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      addToast({ title: "Access updated", message: `Permissions saved for ${selected.name}.`, type: "success" });
      await load();
    } catch (e: unknown) {
      addToast({
        title: "Save failed",
        message: e instanceof Error ? e.message : "Could not update permissions.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (permLoading || loading) {
    return (
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 text-[12px] text-[var(--nova-text-muted)]">
        Loading access control…
      </div>
    );
  }

  if (!canManageOrg) {
    return (
      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 text-[12px] text-[var(--nova-text-secondary)]">
        Only the <strong>organization owner</strong> can assign roles and extra permissions. Ask your owner to
        update access in Team Directory → Access & Permissions.
      </div>
    );
  }

  const permissionEntries = [...catalog, ...(isOwner ? ownerOnly : [])];

  return (
    <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-5 space-y-5">
      <div className="pb-3 border-b border-[var(--nova-border)] flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[var(--nova-accent)]" />
            Access & Permissions
          </h3>
          <p className="text-[11px] text-[var(--nova-text-muted)] mt-1 max-w-xl">
            Each user starts from an org role (<span className="font-mono">member</span>,{" "}
            <span className="font-mono">viewer</span>, <span className="font-mono">admin</span>). Grant or revoke
            specific abilities on top of that role.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-2">
          <div className="text-[11px] font-medium text-[var(--nova-text-secondary)] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Organization members
          </div>
          <div className="border border-[var(--nova-border)] rounded-lg divide-y divide-[var(--nova-border)] max-h-72 overflow-y-auto">
            {members.map((m) => (
              <button
                key={m.userId}
                type="button"
                onClick={() => setSelectedUserId(m.userId)}
                className={`w-full text-left px-3 py-2.5 text-[12px] transition-colors ${
                  selectedUserId === m.userId
                    ? "bg-[var(--nova-accent-subtle)] text-[var(--nova-text-primary)]"
                    : "hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)]"
                }`}
              >
                <div className="font-medium">{m.name}</div>
                <div className="text-[10px] text-[var(--nova-text-muted)] truncate">{m.email}</div>
                <div className="text-[10px] font-mono text-[var(--nova-accent)] mt-0.5">{m.role}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!selected || selected.role === "owner" ? (
            <p className="text-[12px] text-[var(--nova-text-muted)]">
              Select a non-owner member to edit their role and permissions.
            </p>
          ) : (
            <>
              {isOwner && (
                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-muted)] mb-1">
                    Organization role
                  </label>
                  <select
                    value={draftRole}
                    onChange={(e) => {
                      const r = e.target.value as Exclude<OrgRole, "owner">;
                      setDraftRole(r);
                      setDraftPerms(new Set(ROLE_BASE[r]));
                    }}
                    className="w-full max-w-xs px-3 py-2 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[12px]"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer (read-only)</option>
                  </select>
                </div>
              )}

              <div>
                <div className="text-[11px] font-medium text-[var(--nova-text-muted)] mb-2">
                  Capabilities for this user
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {permissionEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex items-start gap-2 p-2 rounded-md border border-[var(--nova-border)] bg-[var(--nova-bg)] cursor-pointer hover:border-[var(--nova-border-strong)]"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={draftPerms.has(entry.id)}
                        onChange={() => togglePerm(entry.id)}
                      />
                      <span className="text-[11px] text-[var(--nova-text-secondary)] leading-snug">
                        {entry.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-[var(--nova-border)]">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-[12px] font-medium disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving…" : "Save access"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
