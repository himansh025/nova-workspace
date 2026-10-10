import { Request, Response } from "express";
import {
  authenticateUser,
  registerUserAccount,
  updateUserProfile,
  revokeSessionToken,
  verifySessionToken,
  verifyEmailWithToken,
  requestPasswordReset,
  resetPasswordWithToken,
} from "../services/auth";
import { getUserOrganizations, getOrganizationMembership } from "../services/organizationService";
import { getRolePermissions } from "../services/rbac";
import { syncTeamInviteNotificationsForUser } from "../services/teamInviteService";
import { broadcastEvent } from "../services/events";
import { parseCookies } from "../middlewares/auth";
import { ENV } from "../config/env";

function setSessionCookie(res: Response, token: string): void {
  const maxAge = ENV.SESSION_EXPIRY_DAYS * 24 * 60 * 60;
  const secureFlag = ENV.IS_PRODUCTION ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `nova_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secureFlag}`
  );
}

function clearSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    "nova_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
}

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email and password are required." });
      }

      const userAgent = req.headers["user-agent"] as string;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;

      const { user, sessionToken } = await authenticateUser(email, password, userAgent, ipAddress);

      await syncTeamInviteNotificationsForUser(user.id, user.email);

      setSessionCookie(res, sessionToken);

      broadcastEvent({
        type: "system",
        category: "system",
        title: "User Authenticated",
        message: `${user.name} logged into ${user.organization || "Nova Workspace"}`,
        link: "/app",
      });

      return res.json({
        success: true,
        user,
        sessionToken, // for backwards-compatibility
      });
    } catch (error: any) {
      const isAuthFail = error.message?.includes("Invalid email or password") || error.message?.includes("temporarily locked");
      const statusCode = isAuthFail ? 401 : 500;
      return res.status(statusCode).json({ success: false, error: error.message || "Login failed." });
    }
  },

  async signup(req: Request, res: Response) {
    try {
      const { name, email, password, role, organization } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: "Name, email, and password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
      }

      const { user, sessionToken } = await registerUserAccount({
        name,
        email,
        password,
        role,
        organizationName: organization,
      });

      await syncTeamInviteNotificationsForUser(user.id, user.email);

      setSessionCookie(res, sessionToken);

      broadcastEvent({
        type: "system",
        category: "system",
        title: user.organizationId ? "New Team Member Joined" : "New User Registered",
        message: `${user.name} registered${user.role ? ` as ${user.role}` : ""}`,
        link: user.organizationId ? "/app/team" : "/app",
      });

      return res.status(201).json({
        success: true,
        user,
        token: sessionToken,
        sessionToken,
      });
    } catch (error: any) {
      const isConflict = error.message?.includes("already exists");
      const statusCode = isConflict ? 409 : 400;
      return res.status(statusCode).json({ success: false, error: error.message || "Failed to create account." });
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

      const sessionData = await verifySessionToken(token);
      if (!sessionData) {
        clearSessionCookie(res);
        return res.status(401).json({ success: false, authenticated: false, error: "Session expired or invalid" });
      }

      // Fetch all organizations the user is a member of
      const userOrgs = await getUserOrganizations(sessionData.user.id);
      const requestedOrgId =
        (req.headers["x-organization-id"] as string) || sessionData.organizationId;
      const activeOrgId =
        requestedOrgId &&
        userOrgs.some((o) => o.organization.id === requestedOrgId)
          ? requestedOrgId
          : sessionData.organizationId;
      const activeRole = activeOrgId
        ? await getOrganizationMembership(activeOrgId, sessionData.user.id)
        : null;

      return res.json({
        success: true,
        authenticated: true,
        user: sessionData.user,
        organizationId: activeOrgId,
        role: activeRole,
        permissions: activeRole ? getRolePermissions(activeRole) : [],
        organizations: userOrgs.map((o) => ({
          id: o.organization.id,
          name: o.organization.name,
          slug: o.organization.slug,
          role: o.role,
        })),
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: "Authentication check failed." });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const cookies = parseCookies(req);
      const authHeader = req.headers.authorization;
      let token = cookies["nova_session"];

      if (!token && authHeader?.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }

      if (token) {
        await revokeSessionToken(token);
      }

      clearSessionCookie(res);
      return res.json({ success: true, message: "Logged out successfully." });
    } catch {
      clearSessionCookie(res);
      return res.json({ success: true, message: "Logged out." });
    }
  },

  async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ success: false, error: "Verification token is required." });
      }

      const verified = await verifyEmailWithToken(token);
      if (!verified) {
        return res.status(400).json({ success: false, error: "Invalid or expired verification link." });
      }

      return res.json({ success: true, message: "Email address verified successfully!" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to verify email." });
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: "Email is required." });
      }

      await requestPasswordReset(email);
      return res.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been dispatched.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to process password reset." });
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ success: false, error: "Token and new password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ success: false, error: "Password must be at least 8 characters." });
      }

      const success = await resetPasswordWithToken(token, password);
      if (!success) {
        return res.status(400).json({ success: false, error: "Invalid or expired reset token." });
      }

      return res.json({ success: true, message: "Password updated successfully. Please log in with your new password." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: "Failed to reset password." });
    }
  },

  async updateProfile(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: "Authentication required to update profile." });
      }

      const { name, role, avatar } = req.body;
      const updatedUser = await updateUserProfile(user.id, { name, role, avatar });

      return res.json({
        success: true,
        user: updatedUser,
        message: "Profile updated successfully.",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Failed to update profile." });
    }
  },
};
