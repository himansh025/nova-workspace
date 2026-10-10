import { Request, Response } from "express";
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationMembers,
  getOrganizationMembership,
  invalidateOrganizationMembershipCache,
} from "../services/organizationService";
import {
  GRANTABLE_PERMISSIONS,
  OWNER_ONLY_GRANTABLE,
  PERMISSION_LABELS,
  Permission,
  sanitizePermissionList,
} from "../services/rbac";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel, OrgRole } from "../models/OrganizationMember";
import { UserModel } from "../models/User";
import { TeamMemberModel } from "../models/TeamMember";
import { ProjectModel } from "../models/Project";

export const organizationController = {
  async getActive(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const orgId = (req as any).organizationId;

      if (!orgId) {
        return res.status(404).json({ success: false, error: "No active organization found." });
      }

      const org = await OrganizationModel.findOne({ id: orgId, deletedAt: null });
      if (!org) {
        return res.status(404).json({ success: false, error: "Organization not found." });
      }

      const role = await getOrganizationMembership(orgId, user.id);

      return res.json({
        success: true,
        organization: org,
        role,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listUserOrgs(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const orgs = await getUserOrganizations(user.id);
      
      const organizationsWithCounts = await Promise.all(
        orgs.map(async (o) => {
          const projectsCount = await ProjectModel.countDocuments({ organizationId: o.organization.id });
          const membersCount = await OrganizationMemberModel.countDocuments({ organizationId: o.organization.id, deletedAt: null });
          return {
            id: o.organization.id,
            name: o.organization.name,
            slug: o.organization.slug,
            plan: o.organization.plan,
            role: o.role,
            projectsCount,
            membersCount
          };
        })
      );

      return res.json({
        success: true,
        organizations: organizationsWithCounts,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Organization name is required." });
      }

      const org = await createOrganization(name.trim(), user.id);

      return res.status(201).json({
        success: true,
        organization: org,
        role: "owner",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const { name, slug, defaultBranch } = req.body;
      
      const updateData: any = {};
      if (name && name.trim().length > 0) updateData.name = name.trim();
      if (slug && slug.trim().length > 0) updateData.slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
      if (defaultBranch && defaultBranch.trim().length > 0) updateData.defaultBranch = defaultBranch.trim();

      const org = await OrganizationModel.findOneAndUpdate(
        { id: orgId, deletedAt: null },
        { $set: updateData },
        { new: true }
      );

      if (!org) {
        return res.status(404).json({ success: false, error: "Organization not found." });
      }

      return res.json({ success: true, organization: org });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async deleteOrg(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;

      const org = await OrganizationModel.findOneAndUpdate(
        { id: orgId, deletedAt: null },
        { $set: { deletedAt: new Date() } },
        { new: true }
      );

      if (!org) {
        return res.status(404).json({ success: false, error: "Organization not found." });
      }

      // Optionally, you could also soft delete related items like team members, projects, etc.
      // But for a SaaS, just deleting the org and dropping access is often enough if queries strictly filter by org ID.

      return res.json({ success: true, message: "Organization deleted successfully." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async listMembers(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const members = await getOrganizationMembers(orgId);
      return res.json({ success: true, count: members.length, members });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async addMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const { email, role } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, error: "User email is required." });
      }

      const validRoles: OrgRole[] = ["admin", "member", "viewer"];
      const assignedRole: OrgRole = validRoles.includes(role) ? role : "member";

      const targetUser = await UserModel.findOne({ email: email.toLowerCase().trim() });
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          error: "User with this email not found. They must first create an account on NOVA.",
        });
      }

      const existingMember = await OrganizationMemberModel.findOne({
        organizationId: orgId,
        userId: targetUser.id,
        deletedAt: null,
      });

      if (existingMember) {
        return res.status(409).json({ success: false, error: "User is already a member of this organization." });
      }

      await OrganizationMemberModel.create({
        organizationId: orgId,
        userId: targetUser.id,
        role: assignedRole,
        invitedBy: (req as any).user.id,
        joinedAt: new Date(),
      });

      // Link org membership to team directory (preserve squad if invited earlier)
      const normalizedEmail = targetUser.email.toLowerCase().trim();
      await TeamMemberModel.findOneAndUpdate(
        { organizationId: orgId, email: normalizedEmail },
        {
          $set: {
            name: targetUser.name,
            role: targetUser.role,
            avatar: targetUser.avatar,
            initials: targetUser.initials,
            status: "online",
            inviteToken: null,
            inviteExpiresAt: null,
          },
          $setOnInsert: {
            id: targetUser.id,
            organizationId: orgId,
            email: normalizedEmail,
            activeTasksCount: 0,
          },
        },
        { upsert: true, returnDocument: "after" }
      );

      return res.status(201).json({
        success: true,
        message: `${targetUser.name} added to organization as ${assignedRole}.`,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async permissionCatalog(_req: Request, res: Response) {
    const mapEntry = (p: Permission) => ({ id: p, label: PERMISSION_LABELS[p] });
    return res.json({
      success: true,
      grantable: GRANTABLE_PERMISSIONS.map(mapEntry),
      ownerOnly: OWNER_ONLY_GRANTABLE.map(mapEntry),
    });
  },

  async updateMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const targetUserId = req.params.userId as string;
      const granterRole = (req as any).userRole as OrgRole;
      const { role, permissionGrants, permissionRevokes } = req.body;

      const targetMember = await OrganizationMemberModel.findOne({
        organizationId: orgId,
        userId: targetUserId,
        deletedAt: null,
      });

      if (!targetMember) {
        return res.status(404).json({ success: false, error: "Member not found in this organization." });
      }

      if (targetMember.role === "owner") {
        return res.status(403).json({ success: false, error: "Organization owner permissions cannot be changed." });
      }

      const updates: Record<string, unknown> = {};

      if (role !== undefined) {
        if (granterRole !== "owner") {
          return res.status(403).json({ success: false, error: "Only the organization owner can change member roles." });
        }
        const validRoles: OrgRole[] = ["admin", "member", "viewer"];
        if (!validRoles.includes(role)) {
          return res.status(400).json({ success: false, error: "Invalid role. Use admin, member, or viewer." });
        }
        updates.role = role;
      }

      const allowedForGranter = new Set<Permission>([
        ...GRANTABLE_PERMISSIONS,
        ...(granterRole === "owner" ? OWNER_ONLY_GRANTABLE : []),
      ]);

      if (permissionGrants !== undefined) {
        const grants = sanitizePermissionList(permissionGrants);
        for (const p of grants) {
          if (!allowedForGranter.has(p)) {
            return res.status(400).json({ success: false, error: `Cannot grant permission: ${p}` });
          }
        }
        updates.permissionGrants = grants;
      }

      if (permissionRevokes !== undefined) {
        const revokes = sanitizePermissionList(permissionRevokes);
        for (const p of revokes) {
          if (!allowedForGranter.has(p)) {
            return res.status(400).json({ success: false, error: `Cannot revoke permission: ${p}` });
          }
        }
        updates.permissionRevokes = revokes;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, error: "No updates provided." });
      }

      await OrganizationMemberModel.updateOne(
        { organizationId: orgId, userId: targetUserId },
        { $set: updates }
      );
      invalidateOrganizationMembershipCache(orgId, targetUserId);

      const members = await getOrganizationMembers(orgId);
      const updated = members.find((m) => m.userId === targetUserId);

      return res.json({ success: true, member: updated });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async removeMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const targetUserId = req.params.userId as string;
      const requestingUserId = (req as any).user.id;

      if (targetUserId === requestingUserId) {
        return res.status(400).json({ success: false, error: "You cannot remove yourself from the organization." });
      }

      const targetMember = await OrganizationMemberModel.findOne({
        organizationId: orgId,
        userId: targetUserId,
      });

      if (!targetMember) {
        return res.status(404).json({ success: false, error: "Member not found in this organization." });
      }

      if (targetMember.role === "owner") {
        return res.status(403).json({ success: false, error: "Organization owner cannot be removed." });
      }

      await OrganizationMemberModel.deleteOne({ organizationId: orgId, userId: targetUserId });
      invalidateOrganizationMembershipCache(orgId, targetUserId);
      await TeamMemberModel.deleteOne({ organizationId: orgId, id: targetUserId });

      return res.json({ success: true, message: "Member removed from organization." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
