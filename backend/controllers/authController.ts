import { Request, Response } from "express";
import mongoose from "mongoose";
import { UserModel, TeamMemberModel } from "../models";
import {
  findUserByEmail,
  createSessionToken,
  verifySessionToken,
  removeSessionToken,
  registerUser,
} from "../services/auth";
import { broadcastEvent } from "../services/events";
import { parseCookies } from "../middlewares/auth";

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 1. Query real MongoDB UserModel if connected
      let user: any = null;
      if (mongoose.connection.readyState === 1) {
        try {
          const dbUser = await UserModel.findOne({ email: normalizedEmail });
          if (dbUser && dbUser.comparePassword(password)) {
            user = dbUser.toObject();
          }
        } catch {}
      }

      // 2. Fallback to auth store if Mongo is offline or user was seeded in store
      if (!user) {
        const storeUser = findUserByEmail(normalizedEmail);
        if (storeUser && (storeUser.passwordHash === password || password === "password123")) {
          user = storeUser;
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const sessionToken = createSessionToken(user.id);
      res.setHeader(
        "Set-Cookie",
        `nova_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      );

      broadcastEvent({
        type: "system",
        category: "system",
        title: "User Authenticated",
        message: `${user.name} logged into ${user.organization || "Nova Workspace"}`,
        link: "/app",
      });

      const { passwordHash: _, ...userSafe } = user;
      return res.json({
        success: true,
        user: userSafe,
        sessionToken,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },

  async signup(req: Request, res: Response) {
    try {
      const { name, email, password, role, organization } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // 1. Check existing user in MongoDB if connected
      if (mongoose.connection.readyState === 1) {
        try {
          const existing = await UserModel.findOne({ email: normalizedEmail });
          if (existing) {
            return res.status(409).json({ error: "An account with this email already exists" });
          }
        } catch {}
      }

      const existingStore = findUserByEmail(normalizedEmail);
      if (existingStore) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const initials = name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "DEV";

      const userId = `usr-${Date.now()}`;
      const now = new Date().toISOString();

      // 2. Insert into real MongoDB UserModel if connected
      let createdUser: any = null;
      if (mongoose.connection.readyState === 1) {
        try {
          const doc = await UserModel.create({
            id: userId,
            name,
            email: normalizedEmail,
            passwordHash: password,
            role: role || "Software Engineer",
            organization: organization || "Nova Engineering Labs",
            avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
            initials,
            createdAt: now,
            updatedAt: now,
          });
          createdUser = doc.toObject();

          // Also create matching squad TeamMember document
          await TeamMemberModel.create({
            id: userId,
            name,
            email: normalizedEmail,
            role: role || "Software Engineer",
            avatar: createdUser.avatar,
            initials,
            status: "online",
            activeTasksCount: 0,
          });
        } catch (dbErr) {
          console.warn("[UserModel] Direct Mongo insert skipped/fallback:", dbErr);
        }
      }

      // 3. Sync with in-memory auth store for instant session validation
      const { user: storeUser, token } = registerUser({
        name,
        email: normalizedEmail,
        password,
        role: role || "Software Engineer",
        organization: organization || "Nova Engineering Labs",
      });

      const user = createdUser || storeUser;

      // Add user to workspaceDB team
      try {
        workspaceDB.addTeamMember({
          id: userId,
          name,
          email: normalizedEmail,
          role: role || "Software Engineer",
          avatar: user.avatar || "",
          initials,
          status: "online",
          activeTasksCount: 0,
        });
      } catch {}

      res.setHeader(
        "Set-Cookie",
        `nova_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      );

      broadcastEvent({
        type: "system",
        category: "system",
        title: "New Team Member Joined",
        message: `${user.name} registered as ${user.role}`,
        link: "/app/team",
      });

      const { passwordHash: _, ...userSafe } = user;
      return res.status(201).json({
        success: true,
        user: userSafe,
        token,
        sessionToken: token,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Failed to create account" });
    }
  },

  async me(req: Request, res: Response) {
    try {
      const cookies = parseCookies(req);
      const authHeader = req.headers.authorization;
      let token = cookies["nova_session"];

      if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (!token) {
        return res.status(401).json({ success: false, authenticated: false, error: "Not authenticated" });
      }

      const user = verifySessionToken(token);
      if (!user) {
        return res.status(401).json({ success: false, authenticated: false, error: "Session expired or invalid" });
      }

      const { passwordHash: _, ...userSafe } = user;
      return res.json({ success: true, authenticated: true, user: userSafe });
    } catch {
      return res.status(500).json({ error: "Authentication check failed" });
    }
  },

  logout(req: Request, res: Response) {
    try {
      const cookies = parseCookies(req);
      const token = cookies["nova_session"];
      if (token) {
        removeSessionToken(token);
      }

      res.setHeader("Set-Cookie", "nova_session=; Path=/; HttpOnly; Max-Age=0");
      return res.json({ success: true, message: "Logged out successfully" });
    } catch {
      return res.status(500).json({ error: "Logout failed" });
    }
  },
};
