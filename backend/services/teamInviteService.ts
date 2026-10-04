import { TeamMemberModel } from "../models/TeamMember";
import { TeamGroupModel } from "../models/TeamGroup";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel } from "../models/OrganizationMember";
import { UserModel } from "../models/User";
import { notificationService } from "./notificationService";
import { ENV } from "../config/env";
import type { SafeUser } from "./auth";

function inviteExpired(member: { inviteExpiresAt?: Date | null }) {
  return member.inviteExpiresAt && member.inviteExpiresAt < new Date();
}

async function ensureOrganizationMembership(userId: string, organizationId: string) {
  const existing = await OrganizationMemberModel.findOne({
    organizationId,
    userId,
    deletedAt: null,
  });
  if (existing) return;

  await OrganizationMemberModel.create({
    organizationId,
    userId,
    role: "member",
    joinedAt: new Date(),
  });
}

export async function notifyUserOfTeamInvite(
  member: { id: string; email: string; role: string; organizationId: string; name: string; teamGroupId?: string | null },
  orgName: string,
  inviteToken: string
) {
  const user = await UserModel.findOne({ email: member.email.toLowerCase().trim() });
  if (!user) return;

  const existing = await notificationService.findTeamInviteNotification(user.id, member.id);
  if (existing) return;

  let squadLabel = "";
  if (member.teamGroupId) {
    const squad = await TeamGroupModel.findOne({ id: member.teamGroupId, organizationId: member.organizationId });
    if (squad) squadLabel = ` in squad "${squad.name}"`;
  }

  const acceptPath = `/invite/team?token=${inviteToken}`;

  await notificationService.createNotification(
    {
      userId: user.id,
      organizationId: member.organizationId,
      type: "team_invite",
      title: `Team invitation · ${orgName}`,
      body: `You were invited as ${member.role}${squadLabel}. Accept to join the engineering team.`,
      entityType: "team_member",
      entityId: member.id,
      link: acceptPath,
    },
    { broadcast: false }
  );
}

/** Create in-app invites for any pending team rows matching this account email. */
export async function syncTeamInviteNotificationsForUser(userId: string, email: string) {
  const normalized = email.toLowerCase().trim();
  const pending = await TeamMemberModel.find({ email: normalized, status: "pending" });

  for (const member of pending) {
    if (inviteExpired(member) || !member.inviteToken) continue;
    const org = await OrganizationModel.findOne({ id: member.organizationId });
    await notifyUserOfTeamInvite(
      {
        id: member.id,
        email: member.email,
        role: member.role,
        organizationId: member.organizationId,
        name: member.name,
        teamGroupId: member.teamGroupId,
      },
      org?.name || "NOVA Workspace",
      member.inviteToken
    );
  }
}

export async function listPendingInvitesForUser(email: string) {
  const normalized = email.toLowerCase().trim();
  const members = await TeamMemberModel.find({ email: normalized, status: "pending" }).sort({ createdAt: -1 });

  const results = [];
  for (const member of members) {
    if (inviteExpired(member)) continue;
    const org = await OrganizationModel.findOne({ id: member.organizationId });
    let squadName: string | null = null;
    if (member.teamGroupId) {
      const squad = await TeamGroupModel.findOne({ id: member.teamGroupId, organizationId: member.organizationId });
      squadName = squad?.name || null;
    }
    results.push({
      memberId: member.id,
      organizationId: member.organizationId,
      organizationName: org?.name || "NOVA Workspace",
      name: member.name,
      role: member.role,
      squadName,
      expiresAt: member.inviteExpiresAt,
      acceptUrl: member.inviteToken ? `${ENV.APP_URL}/invite/team?token=${member.inviteToken}` : null,
    });
  }
  return results;
}

export async function acceptTeamInviteByToken(token: string, user?: SafeUser | null) {
  const member = await TeamMemberModel.findOne({ inviteToken: token, status: "pending" });
  if (!member) {
    throw new Error("Invitation not found or already accepted.");
  }
  if (inviteExpired(member)) {
    throw new Error("This invitation has expired.");
  }

  if (user) {
    const userEmail = user.email.toLowerCase().trim();
    if (userEmail !== member.email.toLowerCase().trim()) {
      throw new Error("This invitation was sent to a different email address. Sign in with the invited email.");
    }
    await ensureOrganizationMembership(user.id, member.organizationId);
    await notificationService.dismissTeamInviteNotifications(user.id, member.id);
  }

  member.status = "online";
  member.inviteToken = null;
  member.inviteExpiresAt = null;
  await member.save();

  return member;
}

export async function acceptTeamInviteByMemberId(memberId: string, user: SafeUser) {
  const member = await TeamMemberModel.findOne({ id: memberId, status: "pending" });
  if (!member) {
    throw new Error("Invitation not found or already accepted.");
  }
  if (inviteExpired(member)) {
    throw new Error("This invitation has expired.");
  }
  if (user.email.toLowerCase().trim() !== member.email.toLowerCase().trim()) {
    throw new Error("This invitation was sent to a different email address.");
  }

  await ensureOrganizationMembership(user.id, member.organizationId);

  member.status = "online";
  member.inviteToken = null;
  member.inviteExpiresAt = null;
  await member.save();

  await notificationService.dismissTeamInviteNotifications(user.id, member.id);

  return member;
}
