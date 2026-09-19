import { Request, Response } from "express";
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationMembers,
  getOrganizationMembership,
} from "../services/organizationService";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel, OrgRole } from "../models/OrganizationMember";
import { UserModel } from "../models/User";
import { TeamMemberModel } from "../models/TeamMember";

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
      return res.json({
        success: true,
        organizations: orgs.map((o) => ({
          id: o.organization.id,
          name: o.organization.name,
          slug: o.organization.slug,
          plan: o.organization.plan,
          role: o.role,
        })),
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

      // Synchronize into TeamMember collection for the organization
      await TeamMemberModel.findOneAndUpdate(
        { organizationId: orgId, email: targetUser.email },
        {
          id: targetUser.id,
          organizationId: orgId,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          avatar: targetUser.avatar,
          initials: targetUser.initials,
          status: "online",
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
      await TeamMemberModel.deleteOne({ organizationId: orgId, id: targetUserId });

      return res.json({ success: true, message: "Member removed from organization." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },
};
