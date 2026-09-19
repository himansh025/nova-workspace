import crypto from "crypto";
import mongoose from "mongoose";
import { TeamMember } from "./types";
import { db } from "./db";
import { ENV } from "../config/env";
import { UserModel } from "../models";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // In-memory/demo verification
  role: string;
  organization: string;
  avatar: string;
  initials: string;
  createdAt: string;
}

// Global user store preserving hot-reloads
declare global {
  var __novaAuthUsers: AuthUser[] | undefined;
  var __novaSessions: Map<string, string> | undefined; // token -> userId
}

const DEFAULT_AUTH_USERS: AuthUser[] = [];

const users: AuthUser[] = global.__novaAuthUsers || [...DEFAULT_AUTH_USERS];
const sessions: Map<string, string> = global.__novaSessions || new Map<string, string>();

if (process.env.NODE_ENV !== "production") {
  global.__novaAuthUsers = users;
  global.__novaSessions = sessions;
}

export function findUserByEmail(email: string): AuthUser | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): AuthUser | undefined {
  return users.find((u) => u.id === id);
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ENV.JWT_SECRET)
    .update(payload)
    .digest("base64url");
  const token = `nova_${payload}.${signature}`;
  sessions.set(token, userId);
  return token;
}

export async function verifySessionToken(token: string): Promise<AuthUser | any | null> {
  if (!token) return null;

  // 1. Check signed HMAC token (stateless & resilient across serverless instances)
  if (token.startsWith("nova_")) {
    const raw = token.slice(5);
    const dotIndex = raw.indexOf(".");
    if (dotIndex !== -1) {
      const payload = raw.slice(0, dotIndex);
      const signature = raw.slice(dotIndex + 1);
      const expectedSig = crypto
        .createHmac("sha256", ENV.JWT_SECRET)
        .update(payload)
        .digest("base64url");

      if (signature.length === expectedSig.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        try {
          const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
          const userId = data.userId;

          // Query real MongoDB UserModel if connected
          if (mongoose.connection.readyState === 1) {
            try {
              const dbUser = await UserModel.findOne({
                $or: [{ id: userId }, { email: userId }]
              });
              if (dbUser) return dbUser.toObject();
            } catch {}
          }

          // Fallback to in-memory store
          const found = findUserById(userId) || findUserByEmail(userId);
          if (found) return found;
        } catch {}
      }
    }
  }

  // 2. Check in-memory sessions map
  const mappedId = sessions.get(token);
  if (mappedId) {
    if (mongoose.connection.readyState === 1) {
      try {
        const dbUser = await UserModel.findOne({
          $or: [{ id: mappedId }, { email: mappedId }]
        });
        if (dbUser) return dbUser.toObject();
      } catch {}
    }
    return findUserById(mappedId) || null;
  }

  // 3. Fallback: if token is sess_usr-xxx, extract the user id directly
  if (token.startsWith("sess_")) {
    const parts = token.split("_");
    if (parts.length >= 2) {
      const parsedId = parts[1];
      if (mongoose.connection.readyState === 1) {
        try {
          const dbUser = await UserModel.findOne({
            $or: [{ id: parsedId }, { email: parsedId }]
          });
          if (dbUser) return dbUser.toObject();
        } catch {}
      }
      return findUserById(parsedId) || null;
    }
  }

  return null;
}

export function removeSessionToken(token: string): boolean {
  return sessions.delete(token);
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role?: string;
  organization?: string;
}): { user: AuthUser; token: string } {
  const existing = findUserByEmail(input.email);
  if (existing) {
    throw new Error("User with this email already exists");
  }

  const initials = input.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const newUser: AuthUser = {
    id: `usr-${Date.now()}`,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: input.password,
    role: input.role || "Software Engineer",
    organization: input.organization || "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    initials: initials || "DEV",
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);

  // Sync with workspace team list in db
  try {
    db.addTeamMember({
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      initials: newUser.initials,
      status: "online",
    });
  } catch (err) {
    console.warn("Failed to sync team member into db:", err);
  }

  const token = createSessionToken(newUser.id);
  return { user: newUser, token };
}
