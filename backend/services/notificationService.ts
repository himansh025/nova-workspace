import { NotificationModel, INotificationDocument } from "../models/Notification";
import { broadcastEvent } from "./events";

export const notificationService = {
  async getNotifications(userId: string, organizationId: string, limit: number = 30) {
    return NotificationModel.find({
      userId,
      $or: [{ organizationId }, { type: "team_invite" }],
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    return NotificationModel.countDocuments({
      userId,
      readAt: null,
      $or: [{ organizationId }, { type: "team_invite" }],
    });
  },

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const res = await NotificationModel.updateOne(
      { id, userId },
      { $set: { readAt: new Date() } }
    );
    return res.modifiedCount > 0;
  },

  async markAllAsRead(userId: string, organizationId: string): Promise<number> {
    const res = await NotificationModel.updateMany(
      { userId, organizationId, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.modifiedCount;
  },

  async createNotification(
    input: {
      userId: string;
      organizationId: string;
      type: string;
      title: string;
      body: string;
      entityType?: string;
      entityId?: string;
      link?: string;
    },
    options?: { broadcast?: boolean }
  ): Promise<INotificationDocument> {
    const notif = await NotificationModel.create({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: input.userId,
      organizationId: input.organizationId,
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
      link: input.link,
    });

    if (options?.broadcast !== false) {
      broadcastEvent({
        type: "system",
        category: "system",
        title: input.title,
        message: input.body,
        link: input.link,
        meta: { notificationId: notif.id, userId: input.userId, organizationId: input.organizationId },
      });
    }

    return notif;
  },

  async findTeamInviteNotification(userId: string, teamMemberId: string) {
    return NotificationModel.findOne({
      userId,
      type: "team_invite",
      entityType: "team_member",
      entityId: teamMemberId,
      readAt: null,
    });
  },

  async dismissTeamInviteNotifications(userId: string, teamMemberId: string) {
    await NotificationModel.updateMany(
      { userId, type: "team_invite", entityType: "team_member", entityId: teamMemberId },
      { $set: { readAt: new Date() } }
    );
  },
};
