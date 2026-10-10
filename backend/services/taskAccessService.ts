import { Request } from "express";
import { TeamMemberModel } from "../models/TeamMember";
import { resolveProjectAccess } from "./projectAccessService";
import { hasEffectivePermission } from "./rbac";
import { OrgRole } from "../models/OrganizationMember";

type TaskRef = {
  assignee?: { id?: string } | null;
  creatorUserId?: string | null;
};

async function isTaskAssignee(
  req: Request,
  task: TaskRef
): Promise<boolean> {
  const user = (req as any).user as { id?: string; email?: string } | undefined;
  const assigneeId = task.assignee?.id;
  if (!user?.id || !assigneeId || assigneeId === "unassigned") {
    return false;
  }

  if (assigneeId === user.id) return true;

  const organizationId = (req as any).organizationId || "org-default";
  const email = user.email ? String(user.email).toLowerCase().trim() : "";
  if (!email) return false;

  const member = await TeamMemberModel.findOne({ organizationId, email }).lean();
  return Boolean(member && (member as { id: string }).id === assigneeId);
}

function isTaskCreator(req: Request, task: TaskRef): boolean {
  const user = (req as any).user as { id?: string } | undefined;
  const creatorUserId = task.creatorUserId;
  return Boolean(user?.id && creatorUserId && creatorUserId === user.id);
}

function effectivePerms(req: Request) {
  const userRole = (req as any).userRole as OrgRole | undefined;
  const permissionGrants = ((req as any).permissionGrants || []) as import("./rbac").Permission[];
  const permissionRevokes = ((req as any).permissionRevokes || []) as import("./rbac").Permission[];
  return { userRole, permissionGrants, permissionRevokes };
}

/** Owner/admin, task creator, or assignee may update (status, fields). */
export async function canUserModifyTask(req: Request, task: TaskRef): Promise<boolean> {
  const access = await resolveProjectAccess(req);
  if (access.isPrivileged) return true;

  const { userRole, permissionGrants, permissionRevokes } = effectivePerms(req);
  if (
    userRole &&
    hasEffectivePermission(userRole, "organization:manage", permissionGrants, permissionRevokes)
  ) {
    return true;
  }

  if (!hasEffectivePermission(userRole, "task:update", permissionGrants, permissionRevokes)) {
    return false;
  }

  if (isTaskCreator(req, task)) return true;
  return await isTaskAssignee(req, task);
}

/** Owner/admin, creator, or assignee with task:delete may remove a task. */
export async function canUserDeleteTask(req: Request, task: TaskRef): Promise<boolean> {
  const access = await resolveProjectAccess(req);
  if (access.isPrivileged) return true;

  const { userRole, permissionGrants, permissionRevokes } = effectivePerms(req);
  if (
    userRole &&
    hasEffectivePermission(userRole, "organization:manage", permissionGrants, permissionRevokes)
  ) {
    return true;
  }

  if (isTaskCreator(req, task)) return true;

  if (!hasEffectivePermission(userRole, "task:delete", permissionGrants, permissionRevokes)) {
    return false;
  }

  return await isTaskAssignee(req, task);
}
