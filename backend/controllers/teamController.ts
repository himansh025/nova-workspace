import mongoose from "mongoose";
import { Request, Response } from "express";
import { TeamMemberModel } from "../models";
import { db as workspaceDB } from "../services/db";

export const teamController = {
  async getTeam(_req: Request, res: Response) {
    try {
      if (mongoose.connection.readyState === 1) {
        try {
          const team = await TeamMemberModel.find().sort({ createdAt: 1 });
          return res.json({ success: true, team });
        } catch (dbErr) {
          console.warn("[TeamMemberModel] Mongo query fallback:", dbErr);
        }
      }

      const team = workspaceDB.getTeam();
      res.json({ success: true, team });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async addMember(req: Request, res: Response) {
    try {
      const { name, email, role, avatar, initials } = req.body;
      const member = workspaceDB.addTeamMember({
        name,
        email,
        role: role || "Software Engineer",
        avatar: avatar || "",
        initials: initials || name.split(" ").map((n: string) => n[0]).join("").toUpperCase(),
        status: "online",
      });

      try {
        await TeamMemberModel.create(member);
      } catch {}

      res.status(201).json({ success: true, member });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },
};
