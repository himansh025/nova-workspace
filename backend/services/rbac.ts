import { OrgRole } from "../models/OrganizationMember";

export type Permission =
  | "project:read"
  | "project:write"
  | "task:read"
  | "task:create"
  | "task:update"
  | "task:delete"
  | "spec:read"
  | "spec:create"
  | "spec:update"
  | "spec:approve"
  | "sprint:read"
  | "sprint:create"
  | "sprint:update"
  | "release:read"
  | "release:create"
  | "release:deploy"
  | "team:read"
  | "team:manage"
  | "integration:manage"
  | "billing:manage"
  | "organization:manage"
  | "ai:use"
  | "ai:manage";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  owner: [
    "project:read",
    "project:write",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "spec:read",
    "spec:create",
    "spec:update",
    "spec:approve",
    "sprint:read",
    "sprint:create",
    "sprint:update",
    "release:read",
    "release:create",
    "release:deploy",
    "team:read",
    "team:manage",
    "integration:manage",
    "billing:manage",
    "organization:manage",
    "ai:use",
    "ai:manage",
  ],
  admin: [
    "project:read",
    "project:write",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "spec:read",
    "spec:create",
    "spec:update",
    "spec:approve",
    "sprint:read",
    "sprint:create",
    "sprint:update",
    "release:read",
    "release:create",
    "release:deploy",
    "team:read",
    "team:manage",
    "integration:manage",
    "ai:use",
    "ai:manage",
  ],
  member: [
    "project:read",
    "project:write",
    "task:read",
    "task:create",
    "task:update",
    "spec:read",
    "spec:create",
    "spec:update",
    "sprint:read",
    "sprint:update",
    "release:read",
    "release:create",
    "team:read",
    "ai:use",
  ],
  viewer: [
    "project:read",
    "task:read",
    "spec:read",
    "sprint:read",
    "release:read",
    "team:read",
  ],
};

export function hasPermission(role: OrgRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getRolePermissions(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
