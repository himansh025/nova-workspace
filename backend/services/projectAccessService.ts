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

export async function resolveProjectAccess(req: Request): Promise<ProjectAccessContext> {
  const organizationId = (req as any).organizationId || "org-default";
  const user = (req as any).user;
  const userRole = (req as any).userRole as OrgRole | undefined;

  const isPrivileged = userRole === "owner" || userRole === "admin";

  if (!user?.id && !user?.email) {
    return { organizationId, isPrivileged, teamGroupId: null, memberFound: false };
  }

  const member = await TeamMemberModel.findOne({
    organizationId,
    $or: [{ id: user.id }, { email: String(user.email).toLowerCase().trim() }],
  });

  if (!member || member.status === "pending") {
    return {
      organizationId,
      isPrivileged,
      teamGroupId: null,
      memberFound: Boolean(member),
    };
  }

  return {
    organizationId,
    isPrivileged,
    teamGroupId: member.teamGroupId || null,
    memberFound: true,
  };
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
  const projects = await ProjectModel.find(projectVisibilityFilter(access)).select("id");
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
  });
  if (!project) return false;

  const squadId = project.teamGroupId;
  if (!squadId) return true;
  return squadId === access.teamGroupId;
}
