import { Request, Response } from "express";
import { integrationSettingsService } from "../services/integrationSettingsService";

export const integrationController = {
  async getSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const settings = await integrationSettingsService.getSettings(orgId);
      return res.json({ success: true, settings });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async saveSmtp(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { host, port, secure, user, password, from, enabled } = req.body;

      if (!host || !user) {
        return res.status(400).json({ success: false, error: "SMTP host and username are required." });
      }

      const settings = await integrationSettingsService.saveSmtpSettings({
        organizationId: orgId,
        host,
        port: Number(port) || 587,
        secure: Boolean(secure),
        user,
        password,
        from,
        enabled: Boolean(enabled),
      });

      return res.json({ success: true, message: "SMTP configuration saved.", settings });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async testSmtp(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const user = (req as any).user;
      const { recipient } = req.body;
      const targetEmail = recipient || user?.email;

      if (!targetEmail) {
        return res.status(400).json({ success: false, error: "Recipient email is required for test." });
      }

      const result = await integrationSettingsService.testSmtpConnection(orgId, targetEmail);
      return res.json({
        success: true,
        message: `Test email successfully dispatched to ${targetEmail}.`,
        messageId: result.messageId,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async saveGithub(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { clientId, clientSecret, webhookSecret, repository, enabled } = req.body;

      if (!clientId) {
        return res.status(400).json({ success: false, error: "GitHub Client ID is required." });
      }

      const settings = await integrationSettingsService.saveGithubSettings({
        organizationId: orgId,
        clientId,
        clientSecret,
        webhookSecret,
        repository,
        enabled: Boolean(enabled),
      });

      return res.json({ success: true, message: "GitHub integration settings saved.", settings });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async testGithub(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const result = await integrationSettingsService.testGithubConnection(orgId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};
