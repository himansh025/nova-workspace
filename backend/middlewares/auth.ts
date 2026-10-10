import { Request, Response, NextFunction } from "express";
import { verifySessionToken, SafeUser } from "../services/auth";
import { getOrganizationMembershipContext } from "../services/organizationService";
import { hasEffectivePermission, Permission } from "../services/rbac";
import { OrgRole } from "../models/OrganizationMember";

// Extend Express Request interface with authenticated context
export interface AuthenticatedRequest extends Request {
  user: SafeUser;
  organizationId: string;
  userRole?: OrgRole;
  sessionId: string;
}

export function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("="));
    }
  });
  return list;
}

/**
 * Ensures user is authenticated via secure session cookie or Bearer header.
 */
export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req);
    const authHeader = req.headers.authorization;
    let token = cookies["nova_session"];

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return res.status(401).json({
        data: null,
        error: { code: "UNAUTHORIZED", message: "Authentication session required." },
      });
    }

    const sessionData = await verifySessionToken(token);
    if (!sessionData) {
      return res.status(401).json({
        data: null,
        error: { code: "SESSION_EXPIRED", message: "Session is invalid or has expired. Please log in again." },
      });
    }

    (req as any).user = sessionData.user;
    (req as any).sessionId = sessionData.sessionId;

    // Allow switching organization via custom header if user belongs to that organization
    const requestedOrgId = (req.headers["x-organization-id"] as string) || sessionData.organizationId;
    const attachMembership = async (orgId: string) => {
      const membership = await getOrganizationMembershipContext(orgId, sessionData.user.id);
      if (!membership) return false;
      (req as any).organizationId = orgId;
      (req as any).userRole = membership.role;
      (req as any).permissionGrants = membership.permissionGrants;
      (req as any).permissionRevokes = membership.permissionRevokes;
      return true;
    };

    if (requestedOrgId) {
      if (!(await attachMembership(requestedOrgId))) {
        await attachMembership(sessionData.organizationId || "");
      }
    } else {
      (req as any).organizationId = sessionData.organizationId;
      if (sessionData.organizationId) {
        await attachMembership(sessionData.organizationId);
      }
    }

    next();
  } catch (err: any) {
    console.error("[authGuard Error]:", err);
    return res.status(500).json({
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Authentication validation failed." },
    });
  }
}

/** Attaches user/session when a valid token is present; does not reject unauthenticated requests. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const cookies = parseCookies(req);
    const authHeader = req.headers.authorization;
    let token = cookies["nova_session"];

    if (!token && authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      return next();
    }

    const sessionData = await verifySessionToken(token);
    if (!sessionData) {
      return next();
    }

    (req as any).user = sessionData.user;
    (req as any).sessionId = sessionData.sessionId;
    (req as any).organizationId = sessionData.organizationId;
  } catch {
    // ignore optional auth failures
  }
  next();
}

/**
 * Middleware that strictly enforces the presence of a verified organizationId on the request.
 */
export async function requireOrg(req: Request, res: Response, next: NextFunction) {
  const orgId = (req as any).organizationId;
  if (!orgId) {
    return res.status(400).json({
      data: null,
      error: { code: "ORGANIZATION_REQUIRED", message: "An active organization context is required for this operation." },
    });
  }
  next();
}

/**
 * Middleware factory that enforces specific RBAC permission.
 */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole as OrgRole | undefined;
    const permissionGrants = ((req as any).permissionGrants || []) as Permission[];
    const permissionRevokes = ((req as any).permissionRevokes || []) as Permission[];

    if (!userRole) {
      return res.status(403).json({
        data: null,
        error: { code: "FORBIDDEN", message: "You do not have membership in this organization." },
      });
    }

    if (!hasEffectivePermission(userRole, permission, permissionGrants, permissionRevokes)) {
      return res.status(403).json({
        data: null,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Permission denied: '${permission}' required for this action.`,
        },
      });
    }

    next();
  };
}
