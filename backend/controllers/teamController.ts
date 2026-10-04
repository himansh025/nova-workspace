import { Request, Response } from "express";
import { TeamMemberModel } from "../models/TeamMember";
import { TaskModel } from "../models/Task";
import { TeamGroupModel } from "../models/TeamGroup";

export const teamController = {
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
          return { ...m, activeTasksCount };
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
      });

      return res.status(201).json({ success: true, member });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },

  async getGroups(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const groups = await TeamGroupModel.find({ organizationId: orgId }).sort({ createdAt: 1 });
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
      if (typeof status === "string") updates.status = status;
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

      return res.json({ success: true, member: { ...m, activeTasksCount } });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
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
