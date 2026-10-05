import mongoose from "mongoose";
import { Request, Response } from "express";
import { TaskModel, SpecModel, ProjectModel, ReleaseModel, ActivityItemModel, UserModel } from "../models";
import { getMongoState } from "../config/db";
import { analyticsService } from "../services/analyticsService";
import { aiService } from "../services/aiService";
import { notificationService } from "../services/notificationService";
import { ENV } from "../config/env";

export const systemController = {
  async health(_req: Request, res: Response) {
    const mongoState = getMongoState();
    let counts = {};
    if (mongoState.isConnected) {
      try {
        const [tasks, specs, projects, releases, users] = await Promise.all([
          TaskModel.countDocuments(),
          SpecModel.countDocuments(),
          ProjectModel.countDocuments(),
          ReleaseModel.countDocuments(),
          UserModel.countDocuments(),
        ]);
        counts = { tasks, specs, projects, releases, users };
      } catch {}
    }

    return res.json({
      status: "online",
      mode: ENV.APP_MODE,
      server: "NOVA Production Multi-Tenant Backend",
      version: "2.0.0",
      timestamp: new Date().toISOString(),
      database: {
        type: "MongoDB Atlas",
        connected: mongoState.isConnected,
      },
      emailEnabled: ENV.EMAIL_ENABLED,
      recordCounts: counts,
    });
  },

  async readiness(_req: Request, res: Response) {
    const isReady = mongoose.connection.readyState === 1;
    if (isReady) {
      return res.status(200).json({ status: "ready", timestamp: new Date().toISOString() });
    }
    return res.status(503).json({ status: "not_ready", error: "Database not connected" });
  },

  async getAnalytics(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const analytics = await analyticsService.getAnalytics(orgId);
      return res.json({ success: true, analytics });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getActivity(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const activities = await ActivityItemModel.find({ organizationId: orgId })
        .sort({ createdAt: -1 })
        .limit(limit);

      const formatRelativeTime = (date: Date): string => {
        const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffInSeconds < 60) return "Just now";
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      };

      const formattedActivities = activities.map(act => {
        const doc = act.toJSON() as any;
        if (doc.createdAt) {
          doc.timestamp = formatRelativeTime(doc.createdAt);
        }
        return doc;
      });

      return res.json({ success: true, count: formattedActivities.length, activities: formattedActivities });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async aiChat(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { message, presetId } = req.body;
      const result = await aiService.chat(orgId, message || "", presetId);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async aiGenerateCode(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { specId, language } = req.body;
      if (!specId) {
        return res.status(400).json({ success: false, error: "specId is required." });
      }
      const result = await aiService.generateCode(orgId, specId, language);
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async getNotifications(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const orgId = (req as any).organizationId;
      if (!user || !orgId) {
        return res.json({ success: true, notifications: [], unreadCount: 0 });
      }

      const [notifications, unreadCount] = await Promise.all([
        notificationService.getNotifications(user.id, orgId),
        notificationService.getUnreadCount(user.id, orgId),
      ]);

      return res.json({ success: true, notifications, unreadCount });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async markNotificationRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      await notificationService.markAsRead(id as string, user.id);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async markAllNotificationsRead(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const orgId = (req as any).organizationId;
      await notificationService.markAllAsRead(user.id, orgId);
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
