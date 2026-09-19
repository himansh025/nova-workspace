import { Request, Response } from "express";
import { TeamMemberModel } from "../models/TeamMember";

export const teamController = {
  async getTeam(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const team = await TeamMemberModel.find({ organizationId: orgId }).sort({ createdAt: 1 });
      return res.json({ success: true, count: team.length, team });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async addMember(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { name, email, role, avatar, initials } = req.body;

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
        status: "online",
        activeTasksCount: 0,
      });

      return res.status(201).json({ success: true, member });
    } catch (error: any) {
      return res.status(400).json({ success: false, error: error.message });
    }
  },
};
