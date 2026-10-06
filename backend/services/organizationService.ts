import { OrganizationModel, IOrganizationDocument } from "../models/Organization";
import { OrganizationMemberModel, OrgRole } from "../models/OrganizationMember";
import { UserModel } from "../models/User";
import { TeamMemberModel } from "../models/TeamMember";
import { ProjectModel } from "../models/Project";
import crypto from "crypto";

export interface OrgWithRole {
  organization: IOrganizationDocument;
  role: OrgRole;
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}

export async function createOrganization(name: string, ownerUserId: string): Promise<IOrganizationDocument> {
  const orgId = `org-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`;
  const slug = generateSlug(name);

  const org = await OrganizationModel.create({
    id: orgId,
    name: name.trim(),
    slug,
    plan: "free",
  });

  await OrganizationMemberModel.create({
    organizationId: org.id,
    userId: ownerUserId,
    role: "owner",
    joinedAt: new Date(),
  });

  // Also create a default starter project for the organization
  await ProjectModel.create({
    id: `prj-${Date.now().toString(36)}`,
    organizationId: org.id,
    name: `${name.trim()} Main`,
    slug: `${slug}-main`,
    description: "Core workspace projects, features, and engineering specifications.",
    repository: "github.com/organization/main",
    sprint: "Sprint 1",
    progressPercent: 0,
    cycleTime: "--",
    velocity: "0 pts",
    activeBranch: "main",
    isDefaultForTasks: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Ensure owner is added to TeamMember collection for this org
  const user = await UserModel.findOne({ id: ownerUserId });
  if (user) {
    if (!user.organizationId) {
      user.organizationId = org.id;
      await user.save();
    }
    await TeamMemberModel.create({
      id: user.id,
      organizationId: org.id,
      name: user.name,
      email: user.email,
      role: user.role || "Engineering Lead",
      avatar: user.avatar || "",
      initials: user.initials,
      status: "online",
      activeTasksCount: 0,
    });
  }

  return org;
}

const orgRoleCache = new Map<string, { role: OrgRole | null; expiresAt: number }>();
const userOrgsCache = new Map<string, { orgs: OrgWithRole[]; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000;

export async function getUserOrganizations(userId: string): Promise<OrgWithRole[]> {
  const now = Date.now();
  const cached = userOrgsCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.orgs;
  }

  const memberships = await OrganizationMemberModel.find({ userId, deletedAt: null }).lean();
  if (memberships.length === 0) return [];

  const orgIds = memberships.map((m) => m.organizationId);
  const orgs = await OrganizationModel.find({ id: { $in: orgIds }, deletedAt: null }).lean();

  const result: OrgWithRole[] = [];
  for (const m of memberships) {
    const org = orgs.find((o) => o.id === m.organizationId);
    if (org) {
      result.push({ organization: org as any, role: m.role });
    }
  }

  userOrgsCache.set(userId, { orgs: result, expiresAt: now + CACHE_TTL_MS });
  return result;
}

export async function getOrganizationMembership(orgId: string, userId: string): Promise<OrgRole | null> {
  const cacheKey = `${orgId}:${userId}`;
  const now = Date.now();
  const cached = orgRoleCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.role;
  }

  const membership = await OrganizationMemberModel.findOne({
    organizationId: orgId,
    userId,
    deletedAt: null,
  }).lean();

  const role = membership ? membership.role : null;
  orgRoleCache.set(cacheKey, { role, expiresAt: now + CACHE_TTL_MS });
  return role;
}

export async function getOrganizationMembers(orgId: string) {
  const members = await OrganizationMemberModel.find({ organizationId: orgId, deletedAt: null });
  const userIds = members.map((m) => m.userId);
  const users = await UserModel.find({ id: { $in: userIds } });

  return members.map((m) => {
    const u = users.find((user) => user.id === m.userId);
    return {
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      name: u?.name || "Unknown",
      email: u?.email || "",
      avatar: u?.avatar || "",
      initials: u?.initials || "--",
    };
  });
}

export async function ensureDefaultOrganization(userId: string, userName: string, orgName?: string): Promise<string> {
  const existingMemberships = await OrganizationMemberModel.find({ userId, deletedAt: null });
  if (existingMemberships.length > 0) {
    return existingMemberships[0].organizationId;
  }

  const name = orgName || `${userName}'s Workspace`;
  const org = await createOrganization(name, userId);
  return org.id;
}
