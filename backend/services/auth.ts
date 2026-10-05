import { UserModel, IUserDocument } from "../models/User";
import { TeamMemberModel } from "../models/TeamMember";
import { SessionModel } from "../models/Session";
import { EmailVerificationTokenModel, PasswordResetTokenModel } from "../models/AuthTokens";
import { hashPassword, verifyPassword, generateTokenWithHash, hashToken } from "./cryptoService";
import { ensureDefaultOrganization, getUserOrganizations } from "./organizationService";
import { sendVerificationEmail, sendPasswordResetEmail } from "./emailService";
import { ENV } from "../config/env";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  organization?: string;
  avatar: string;
  initials: string;
  emailVerified: boolean;
  createdAt: string;
}

export function toSafeUser(user: IUserDocument, organizationName?: string): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || "Individual",
    organizationId: user.organizationId,
    organization: organizationName || (user.organizationId ? "Nova Workspace" : ""),
    avatar: user.avatar,
    initials: user.initials,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
  };
}

/**
 * Creates a persistent, revocable session in MongoDB.
 * The client receives the raw high-entropy token, while MongoDB only stores its SHA-256 hash.
 */
export async function createSession(
  userId: string,
  organizationId?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const { rawToken, tokenHash } = generateTokenWithHash();
  const expiresAt = new Date(Date.now() + ENV.SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // If organizationId is not provided, resolve default
  let resolvedOrgId = organizationId;
  if (!resolvedOrgId) {
    const orgs = await getUserOrganizations(userId);
    if (orgs.length > 0) {
      resolvedOrgId = orgs[0].organization.id;
    }
  }

  await SessionModel.create({
    tokenHash,
    userId,
    organizationId: resolvedOrgId,
    userAgent,
    ipAddress,
    expiresAt,
  });

  return rawToken;
}

/**
 * Validates a session token from request cookie / header.
 * Checks revocation and expiration in MongoDB.
 */
export async function verifySessionToken(rawToken: string): Promise<{
  user: SafeUser;
  organizationId?: string;
  sessionId: string;
} | null> {
  if (!rawToken || typeof rawToken !== "string") return null;

  const tokenHash = hashToken(rawToken);
  const session = await SessionModel.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  const user = await UserModel.findOne({ id: session.userId, locked: false });
  if (!user) return null;

  // Retrieve user organization details
  let orgName: string | undefined;
  if (session.organizationId) {
    const orgs = await getUserOrganizations(user.id);
    const matched = orgs.find((o) => o.organization.id === session.organizationId);
    orgName = matched?.organization.name;
  }

  return {
    user: toSafeUser(user, orgName),
    organizationId: session.organizationId || user.organizationId,
    sessionId: session._id.toString(),
  };
}

/**
 * Revokes a session token immediately.
 */
export async function revokeSessionToken(rawToken: string): Promise<boolean> {
  if (!rawToken) return false;
  const tokenHash = hashToken(rawToken);
  const result = await SessionModel.updateOne(
    { tokenHash },
    { $set: { revokedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

/**
 * Registers a new user with Argon2id password hash, sends email verification, and assigns an organization.
 */
export async function registerUserAccount(data: {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizationName?: string;
}): Promise<{ user: SafeUser; sessionToken: string }> {
  const normalizedEmail = data.email.toLowerCase().trim();

  // Check if account already exists
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  // Hash password using Argon2id with server pepper
  const passwordHash = await hashPassword(data.password);

  const initials = data.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "DEV";

  const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  // Default to verified if SMTP is not enabled in dev, otherwise require verification
  const isAutoVerified = !ENV.EMAIL_ENABLED;

  const userDoc = await UserModel.create({
    id: userId,
    name: data.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: data.role || "Individual",
    avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80`,
    initials,
    emailVerified: isAutoVerified,
    emailVerifiedAt: isAutoVerified ? new Date() : null,
  });

  // Only create organization if explicitly requested; otherwise user registers as an individual
  let orgId: string | undefined = undefined;
  if (data.organizationName && data.organizationName.trim()) {
    orgId = await ensureDefaultOrganization(
      userDoc.id,
      userDoc.name,
      data.organizationName.trim()
    );
    userDoc.organizationId = orgId;
    await userDoc.save();
  }

  // Generate email verification token if email is enabled
  if (ENV.EMAIL_ENABLED && !isAutoVerified) {
    const { rawToken, tokenHash } = generateTokenWithHash();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await EmailVerificationTokenModel.create({
      userId: userDoc.id,
      tokenHash,
      expiresAt,
    });
    // Send email asynchronously
    sendVerificationEmail(userDoc.email, userDoc.name, rawToken).catch((e) =>
      console.error("[Auth] Failed to dispatch verification email:", e)
    );
  }

  // Create active session
  const sessionToken = await createSession(userDoc.id, orgId);

  return {
    user: toSafeUser(userDoc, data.organizationName),
    sessionToken,
  };
}

/**
 * Updates a user's profile attributes (role, name, avatar) and keeps team membership synced.
 */
export async function updateUserProfile(
  userId: string,
  data: { name?: string; role?: string; avatar?: string }
): Promise<SafeUser> {
  const user = await UserModel.findOne({ id: userId, locked: false });
  if (!user) {
    throw new Error("User not found.");
  }

  if (data.name && data.name.trim()) {
    user.name = data.name.trim();
    user.initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "DEV";
  }

  if (data.role !== undefined && data.role.trim()) {
    user.role = data.role.trim();
  }

  if (data.avatar !== undefined) {
    user.avatar = data.avatar;
  }

  await user.save();

  // Keep TeamMemberModel in sync across organizations if user is a member
  await TeamMemberModel.updateMany(
    { id: user.id },
    {
      $set: {
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        initials: user.initials,
      },
    }
  );

  let orgName: string | undefined;
  if (user.organizationId) {
    const orgs = await getUserOrganizations(user.id);
    const matched = orgs.find((o) => o.organization.id === user.organizationId);
    orgName = matched?.organization.name;
  }

  return toSafeUser(user, orgName);
}

/**
 * Authenticates user credentials using Argon2id with lockout rate-limiting.
 */
export async function authenticateUser(
  email: string,
  password: string,
  userAgent?: string,
  ipAddress?: string
): Promise<{ user: SafeUser; sessionToken: string }> {
  const normalizedEmail = email.toLowerCase().trim();

  // Query user including passwordHash
  const user = await UserModel.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // Check account lockout
  if (user.locked && user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account temporarily locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`);
  }

  // Verify Argon2id password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
      user.locked = true;
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
    }
    await user.save();
    throw new Error("Invalid email or password.");
  }

  // Reset failed login attempts on successful login
  user.failedLoginAttempts = 0;
  user.locked = false;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  user.lastLoginIp = ipAddress;
  await user.save();

  // Resolve organization
  const orgs = await getUserOrganizations(user.id);
  const activeOrgId = orgs.length > 0 ? orgs[0].organization.id : user.organizationId;
  const activeOrgName = orgs.length > 0 ? orgs[0].organization.name : undefined;

  const sessionToken = await createSession(user.id, activeOrgId, userAgent, ipAddress);

  return {
    user: toSafeUser(user, activeOrgName),
    sessionToken,
  };
}

/**
 * Verifies email with token.
 */
export async function verifyEmailWithToken(rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await EmailVerificationTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) return false;

  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  await UserModel.updateOne(
    { id: tokenDoc.userId },
    { $set: { emailVerified: true, emailVerifiedAt: new Date() } }
  );

  return true;
}

/**
 * Requests a password reset token and sends email.
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) return true; // Do not reveal whether user exists

  const { rawToken, tokenHash } = generateTokenWithHash();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetTokenModel.create({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  await sendPasswordResetEmail(user.email, user.name, rawToken);
  return true;
}

/**
 * Resets password using valid reset token.
 */
export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await PasswordResetTokenModel.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) return false;

  const passwordHash = await hashPassword(newPassword);
  await UserModel.updateOne(
    { id: tokenDoc.userId },
    { $set: { passwordHash, failedLoginAttempts: 0, locked: false, lockedUntil: null } }
  );

  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Invalidate all active sessions for this user for security
  await SessionModel.updateMany(
    { userId: tokenDoc.userId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );

  return true;
}
