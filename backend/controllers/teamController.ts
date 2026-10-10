import crypto from "crypto";
import { Request, Response } from "express";
import { TeamMemberModel } from "../models/TeamMember";
import { TaskModel } from "../models/Task";
import { TeamGroupModel } from "../models/TeamGroup";
import { OrganizationModel } from "../models/Organization";
import { sendTeamInviteEmail } from "../services/emailService";
import { ENV } from "../config/env";
import {
  acceptTeamInviteByMemberId,
  acceptTeamInviteByToken,
  listPendingInvitesForUser,
  notifyUserOfTeamInvite,
} from "../services/teamInviteService";
import { resolveProjectAccess } from "../services/projectAccessService";

function sanitizeMember(doc: any) {
  const m = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  delete m.inviteToken;
  delete m._id;
  delete m.__v;
  return m;
}

export const teamController = {
  async getInvite(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const member = await TeamMemberModel.findOne({ inviteToken: token, status: "pending" });
      if (!member) {
        return res.status(404).json({ success: false, error: "Invitation not found or already accepted." });
      }
      if (member.inviteExpiresAt && member.inviteExpiresAt < new Date()) {
        return res.status(410).json({ success: false, error: "This invitation has expired." });
      }

      const org = await OrganizationModel.findOne({ id: member.organizationId });
      return res.json({
        success: true,
        invitation: {
          name: member.name,
          email: member.email,
          role: member.role,
          organizationName: org?.name || "NOVA Workspace",
          expiresAt: member.inviteExpiresAt,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async acceptInvite(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: "Invitation token is required." });
      }

      const user = (req as any).user;
      const member = await acceptTeamInviteByToken(token, user);

      return res.json({
        success: true,
        message: "Invitation accepted. Welcome to the team!",
        member: sanitizeMember(member),
        organizationId: member.organizationId,
      });
    } catch (error: any) {
      const status =
        error.message?.includes("not found") || error.message?.includes("already accepted")
          ? 404
          : error.message?.includes("expired")
            ? 410
            : error.message?.includes("different email")
              ? 403
              : 400;
      return res.status(status).json({ success: false, error: error.message });
    }
  },

  async acceptInviteAuthenticated(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { memberId } = req.body;
      if (!memberId) {
        return res.status(400).json({ success: false, error: "memberId is required." });
      }

      const member = await acceptTeamInviteByMemberId(memberId, user);

      return res.json({
        success: true,
        message: "Invitation accepted. Welcome to the team!",
        member: sanitizeMember(member),
        organizationId: member.organizationId,
      });
    } catch (error: any) {
      const status =
        error.message?.includes("not found") || error.message?.includes("already accepted")
          ? 404
          : error.message?.includes("expired")
            ? 410
            : 403;
      return res.status(status).json({ success: false, error: error.message });
    }
  },

  async getMyInvites(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const invites = await listPendingInvitesForUser(user.email);
      return res.json({ success: true, invites });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getTeam(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const teamDocs = await TeamMemberModel.find({ organizationId: orgId }).sort({ createdAt: 1 });
      
      const team = await Promise.all(
        teamDocs.map(async (doc) => {
          const m = doc.toObject();
          const activeTasksCount = await TaskModel.countDocuments({
            organizationId: orgId,
            "assignee.id": m.id,
            status: { $ne: "done" } // Depending on what is considered active. Let's say not done.
          });
          return sanitizeMember({ ...m, activeTasksCount });
        })
      );
      
      return res.json({ success: true, count: team.length, team });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async addMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { name, email, role, avatar, initials, teamGroupId } = req.body;

      if (!name || !email) {
        return res.status(400).json({ success: false, error: "Name and email are required." });
      }

      const inviteToken = crypto.randomBytes(24).toString("hex");
      const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const member = await TeamMemberModel.create({
        id: `usr-${Date.now().toString(36)}`,
        organizationId: orgId,
        name,
        email: email.toLowerCase().trim(),
        role: role || "Software Engineer",
        avatar: avatar || "",
        initials: initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        status: "pending",
        activeTasksCount: 0,
        teamGroupId: teamGroupId || null,
        inviteToken,
        inviteExpiresAt,
      });

      const org = await OrganizationModel.findOne({ id: orgId });
      const orgName = org?.name || "NOVA Workspace";
      const emailResult = await sendTeamInviteEmail(
        member.email,
        member.name,
        member.role,
        orgName,
        inviteToken
      );

      await notifyUserOfTeamInvite(
        {
          id: member.id,
          email: member.email,
          role: member.role,
          organizationId: member.organizationId,
          name: member.name,
          teamGroupId: member.teamGroupId,
        },
        orgName,
        inviteToken
      );

      const acceptUrl = `${ENV.APP_URL}/invite/team?token=${inviteToken}`;

      return res.status(201).json({
        success: true,
        member: sanitizeMember(member),
        invitation: {
          emailSent: emailResult.simulated !== true,
          simulated: emailResult.simulated === true,
          acceptUrl,
        },
      });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async getGroups(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const access = await resolveProjectAccess(req);
      const filter: Record<string, unknown> = { organizationId: orgId };
      if (!access.isPrivileged && access.teamGroupId) {
        filter.id = access.teamGroupId;
      } else if (!access.isPrivileged && !access.memberFound) {
        return res.json({ success: true, groups: [] });
      }
      const groups = await TeamGroupModel.find(filter).sort({ createdAt: 1 });
      return res.json({ success: true, groups });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async createGroup(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ success: false, error: "Name is required" });

      const group = await TeamGroupModel.create({
        id: `grp-${Date.now().toString(36)}`,
        organizationId: orgId,
        name,
        description: description || ""
      });
      return res.status(201).json({ success: true, group });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateGroup(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const { name, description } = req.body;
      const updates: Record<string, string> = {};
      if (typeof name === "string" && name.trim()) updates.name = name.trim();
      if (typeof description === "string") updates.description = description;

      const group = await TeamGroupModel.findOneAndUpdate(
        { id, organizationId: orgId },
        { $set: updates },
        { returnDocument: "after" }
      );
      if (!group) {
        return res.status(404).json({ success: false, error: "Squad not found" });
      }
      return res.json({ success: true, group });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteGroup(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      await TeamGroupModel.deleteOne({ id, organizationId: orgId });
      await TeamMemberModel.updateMany({ teamGroupId: id, organizationId: orgId }, { $unset: { teamGroupId: 1 } });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async updateMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const { name, email, role, status, teamGroupId } = req.body;

      const updates: Record<string, unknown> = {};
      if (typeof name === "string" && name.trim()) updates.name = name.trim();
      if (typeof email === "string" && email.trim()) updates.email = email.toLowerCase().trim();
      if (typeof role === "string" && role.trim()) updates.role = role.trim();
      if (typeof status === "string") {
        updates.status = status;
        if (status !== "pending") {
          updates.inviteToken = null;
          updates.inviteExpiresAt = null;
        }
      }
      if (teamGroupId === null || teamGroupId === "") {
        updates.teamGroupId = null;
      } else if (typeof teamGroupId === "string") {
        updates.teamGroupId = teamGroupId;
      }

      if (typeof updates.name === "string") {
        updates.initials = (updates.name as string)
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      }

      const member = await TeamMemberModel.findOneAndUpdate(
        { id, organizationId: orgId },
        { $set: updates },
        { returnDocument: "after" }
      );
      if (!member) {
        return res.status(404).json({ success: false, error: "Team member not found" });
      }

      const m = member.toObject();
      const activeTasksCount = await TaskModel.countDocuments({
        organizationId: orgId,
        "assignee.id": m.id,
        status: { $ne: "done" },
      });

      return res.json({ success: true, member: sanitizeMember({ ...m, activeTasksCount }) });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async resendInvite(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const member = await TeamMemberModel.findOne({ id, organizationId: orgId, status: "pending" });
      if (!member) {
        return res.status(404).json({ success: false, error: "Pending invitation not found for this member." });
      }

      const inviteToken = crypto.randomBytes(24).toString("hex");
      member.inviteToken = inviteToken;
      member.inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await member.save();

      const org = await OrganizationModel.findOne({ id: orgId });
      const emailResult = await sendTeamInviteEmail(
        member.email,
        member.name,
        member.role,
        org?.name || "NOVA Workspace",
        inviteToken
      );

      const orgName = org?.name || "NOVA Workspace";
      await notifyUserOfTeamInvite(
        {
          id: member.id,
          email: member.email,
          role: member.role,
          organizationId: member.organizationId,
          name: member.name,
          teamGroupId: member.teamGroupId,
        },
        orgName,
        inviteToken
      );

      const acceptUrl = `${ENV.APP_URL}/invite/team?token=${inviteToken}`;
      return res.json({
        success: true,
        invitation: {
          emailSent: emailResult.simulated !== true,
          simulated: emailResult.simulated === true,
          acceptUrl,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async deleteMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const id = req.params.id as string;
      const result = await TeamMemberModel.deleteOne({ id, organizationId: orgId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: "Team member not found" });
      }
      return res.json({ success: true, deletedId: id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

};
