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

/** Permissions an org owner may grant/revoke per user (beyond role defaults). */
export const GRANTABLE_PERMISSIONS: Permission[] = [
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
];

/** Only the organization owner role may assign these via overrides. */
export const OWNER_ONLY_GRANTABLE: Permission[] = ["organization:manage", "billing:manage"];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "project:read": "View projects",
  "project:write": "Create / edit / delete projects",
  "task:read": "View tasks",
  "task:create": "Create tasks",
  "task:update": "Edit tasks",
  "task:delete": "Delete tasks",
  "spec:read": "View specs",
  "spec:create": "Create specs",
  "spec:update": "Edit specs",
  "spec:approve": "Approve specs",
  "sprint:read": "View sprints",
  "sprint:create": "Create sprints",
  "sprint:update": "Edit sprints",
  "release:read": "View releases",
  "release:create": "Create releases",
  "release:deploy": "Deploy releases",
  "team:read": "View team directory",
  "team:manage": "Manage squads & members",
  "integration:manage": "Manage integrations",
  "billing:manage": "Manage billing",
  "organization:manage": "Manage organization settings",
  "ai:use": "Use AI copilot",
  "ai:manage": "Manage AI settings",
};

const ALL_PERMISSIONS = new Set<string>(Object.keys(PERMISSION_LABELS));

export function isValidPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.has(value);
}

export function sanitizePermissionList(values: unknown): Permission[] {
  if (!Array.isArray(values)) return [];
  const out: Permission[] = [];
  for (const v of values) {
    if (typeof v === "string" && isValidPermission(v) && !out.includes(v)) {
      out.push(v);
    }
  }
  return out;
}

export function getRolePermissions(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function resolveEffectivePermissions(
  role: OrgRole | undefined,
  permissionGrants: Permission[] = [],
  permissionRevokes: Permission[] = []
): Permission[] {
  if (!role) return [];
  if (role === "owner") return getRolePermissions("owner");

  const effective = new Set(getRolePermissions(role));
  for (const p of permissionGrants) effective.add(p);
  for (const p of permissionRevokes) effective.delete(p);
  return [...effective];
}

export function hasPermission(role: OrgRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return getRolePermissions(role).includes(permission);
}

export function hasEffectivePermission(
  role: OrgRole | undefined,
  permission: Permission,
  permissionGrants: Permission[] = [],
  permissionRevokes: Permission[] = []
): boolean {
  return resolveEffectivePermissions(role, permissionGrants, permissionRevokes).includes(permission);
}
