"use client";

import { useCallback, useEffect, useState } from "react";

export type OrgPermission =
  | "project:read"
  | "project:write"
  | "task:read"
  | "task:create"
  | "task:update"
  | "task:delete"
  | "team:read"
  | "team:manage"
  | "organization:manage"
  | "ai:use"
  | "ai:manage";

export function useOrgPermissions() {
  const [permissions, setPermissions] = useState<OrgPermission[]>([]);
  const [orgRole, setOrgRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (typeof window !== "undefined") {
        const orgId = localStorage.getItem("nova_active_org_id");
        const token = localStorage.getItem("nova_token");
        if (orgId) headers["x-organization-id"] = orgId;
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/auth/me", { credentials: "include", headers });
      const data = await res.json();
      if (data.authenticated) {
        setOrgRole(data.role || null);
        setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
      } else {
        setOrgRole(null);
        setPermissions([]);
      }
    } catch {
      setOrgRole(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const can = (permission: OrgPermission) => permissions.includes(permission);

  return {
    loading,
    orgRole,
    permissions,
    can,
    canManageTeam: can("team:manage"),
    canWriteProjects: can("project:write"),
    canManageOrg: can("organization:manage"),
    canDeleteTasks: can("task:delete"),
    isOwner: orgRole === "owner",
    isAdmin: orgRole === "admin" || orgRole === "owner",
    refresh,
  };
}
