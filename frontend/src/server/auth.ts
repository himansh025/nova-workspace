import { TeamMember } from "./types";
import { db } from "./db";

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

const DEFAULT_AUTH_USERS: AuthUser[] = [
  {
    id: "usr-1",
    name: "Elena Rostova",
    email: "elena@nova.dev",
    passwordHash: "password123",
    role: "Lead Architect",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    initials: "ER",
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "usr-2",
    name: "Marcus Chen",
    email: "marcus@nova.dev",
    passwordHash: "password123",
    role: "Staff Frontend Engineer",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    initials: "MC",
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "usr-3",
    name: "Siddharth N.",
    email: "siddharth@nova.dev",
    passwordHash: "password123",
    role: "Distributed Systems Lead",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    initials: "SN",
    createdAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "usr-5",
    name: "Aaliyah Patel",
    email: "aaliyah@nova.dev",
    passwordHash: "password123",
    role: "Security & Compliance Lead",
    organization: "Nova Engineering Labs",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    initials: "AP",
    createdAt: "2026-08-20T10:00:00Z",
  },
];

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
  const token = `sess_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  sessions.set(token, userId);
  return token;
}

export function verifySessionToken(token: string): AuthUser | null {
  const userId = sessions.get(token);
  if (!userId) return null;
  return findUserById(userId) || null;
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
