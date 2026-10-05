import { Request } from "express";
import { ProjectModel } from "../models/Project";
import { TeamMemberModel } from "../models/TeamMember";
import { OrgRole } from "../models/OrganizationMember";

export interface ProjectAccessContext {
  organizationId: string;
  isPrivileged: boolean;
  teamGroupId: string | null;
  memberFound: boolean;
}

const accessCache = new Map<string, { ctx: ProjectAccessContext; expiresAt: number }>();
const ACCESS_CACHE_TTL_MS = 60 * 1000;

export async function resolveProjectAccess(req: Request): Promise<ProjectAccessContext> {
  const organizationId = (req as any).organizationId || "org-default";
  const user = (req as any).user;
  const userRole = (req as any).userRole as OrgRole | undefined;

  const isPrivileged = userRole === "owner" || userRole === "admin";

  // Fast path: Owners and admins have full access, skip querying TeamMember entirely!
  if (isPrivileged) {
    return { organizationId, isPrivileged: true, teamGroupId: null, memberFound: true };
  }

  if (!user?.id && !user?.email) {
    return { organizationId, isPrivileged: false, teamGroupId: null, memberFound: false };
  }

  const cacheKey = `${organizationId}:${user.id || user.email}`;
  const now = Date.now();
  const cached = accessCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.ctx;
  }

  const member = await TeamMemberModel.findOne({
    organizationId,
    $or: [{ id: user.id }, { email: String(user.email).toLowerCase().trim() }],
  }).lean();

  if (!member || (member as any).status === "pending") {
    const ctx = {
      organizationId,
      isPrivileged: false,
      teamGroupId: null,
      memberFound: Boolean(member),
    };
    accessCache.set(cacheKey, { ctx, expiresAt: now + ACCESS_CACHE_TTL_MS });
    return ctx;
  }

  const ctx = {
    organizationId,
    isPrivileged: false,
    teamGroupId: (member as any).teamGroupId || null,
    memberFound: true,
  };
  accessCache.set(cacheKey, { ctx, expiresAt: now + ACCESS_CACHE_TTL_MS });
  return ctx;
}

/** Mongo filter for projects visible to this viewer */
export function projectVisibilityFilter(access: ProjectAccessContext): Record<string, unknown> {
  const base = { organizationId: access.organizationId };

  if (access.isPrivileged) {
    return base;
  }

  if (access.teamGroupId) {
    return {
      ...base,
      $or: [
        { teamGroupId: null },
        { teamGroupId: { $exists: false } },
        { teamGroupId: access.teamGroupId },
      ],
    };
  }

  return {
    ...base,
    $or: [{ teamGroupId: null }, { teamGroupId: { $exists: false } }],
  };
}

export async function getAccessibleProjectIds(access: ProjectAccessContext): Promise<string[]> {
  const projects = await ProjectModel.find(projectVisibilityFilter(access)).select("id").lean();
  return projects.map((p) => p.id);
}

export async function canAccessProject(
  access: ProjectAccessContext,
  projectId: string | null | undefined
): Promise<boolean> {
  if (!projectId) return access.isPrivileged;
  if (access.isPrivileged) return true;

  const project = await ProjectModel.findOne({
    organizationId: access.organizationId,
    id: projectId,
  }).lean();
  if (!project) return false;

  const squadId = (project as any).teamGroupId;
  if (!squadId) return true;
  return squadId === access.teamGroupId;
}
