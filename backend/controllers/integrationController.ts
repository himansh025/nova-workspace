import { Request, Response } from "express";
import { integrationSettingsService } from "../services/integrationSettingsService";
import { githubAppService, verifyGitHubInstallState } from "../services/githubAppService";

export const integrationController = {
  async getSettings(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
      const settings = await integrationSettingsService.getSettings(orgId);
      const appStatus = await githubAppService.getStatus(orgId);

      return res.json({
        success: true,
        settings,
        githubApp: appStatus,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async saveSmtp(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
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
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
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

  // ─── GITHUB APP ENDPOINTS ──────────────────────────────────────────────────

  async getGithubAppStatus(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
      const status = await githubAppService.getStatus(orgId);
      return res.json({ success: true, ...status });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async getGithubInstallUrl(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).user?.id;
      if (!orgId || !userId) {
        return res.status(400).json({ success: false, error: "User and organization context required." });
      }

      if (!githubAppService.isConfigured()) {
        return res.status(400).json({
          success: false,
          error: "GitHub App is not configured on the server. Please verify GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_APP_URL.",
        });
      }

      const installUrl = githubAppService.getInstallUrl(userId, orgId);
      return res.json({ success: true, url: installUrl });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  async handleGithubInstallCallback(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = (req as any).user?.id;
      if (!orgId || !userId) {
        return res.status(400).json({ success: false, error: "Authentication and organization required." });
      }

      const installationId = req.body.installation_id || req.query.installation_id;
      const state = req.body.state || req.query.state;

      if (!installationId) {
        return res.status(400).json({ success: false, error: "Missing installation_id parameter." });
      }

      if (!state) {
        return res.status(400).json({ success: false, error: "Missing state security parameter." });
      }

      // Verify CSRF / state parameter matches current user and organization
      verifyGitHubInstallState(String(state), userId, orgId);

      const installation = await githubAppService.upsertInstallation({
        organizationId: orgId,
        userId,
        githubInstallationId: Number(installationId),
      });

      return res.json({
        success: true,
        message: "GitHub App successfully installed and linked to organization.",
        installation: {
          id: installation.id,
          accountLogin: installation.accountLogin,
          status: installation.status,
          githubInstallationId: installation.githubInstallationId,
        },
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async listGithubRepositories(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }

      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 30;

      const result = await githubAppService.listRepositories(orgId, page, perPage);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async selectGithubRepository(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }

      const { githubRepositoryId, selectedBranch } = req.body;
      if (!githubRepositoryId) {
        return res.status(400).json({ success: false, error: "githubRepositoryId is required." });
      }

      const repo = await githubAppService.selectRepository(
        orgId,
        Number(githubRepositoryId),
        selectedBranch
      );

      return res.json({
        success: true,
        message: `Repository ${repo.fullName} selected for organization.`,
        repository: repo,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async listGithubBranches(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }

      const repositoryId = req.query.repositoryId as string;
      if (!repositoryId) {
        return res.status(400).json({ success: false, error: "repositoryId query parameter is required." });
      }

      const page = Number(req.query.page) || 1;
      const perPage = Number(req.query.perPage) || 100;

      const result = await githubAppService.listBranches(orgId, repositoryId, page, perPage);
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async selectGithubBranch(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }

      const { repositoryId, branch } = req.body;
      if (!repositoryId || !branch) {
        return res.status(400).json({ success: false, error: "repositoryId and branch are required." });
      }

      const repo = await githubAppService.selectBranch(orgId, repositoryId, branch);
      return res.json({
        success: true,
        message: `Branch ${branch} selected for repository ${repo.fullName}.`,
        repository: repo,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async disconnectGithub(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }

      const result = await githubAppService.disconnect(orgId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  },

  // ─── LEGACY PAT ENDPOINTS (DEPRECATED) ────────────────────────────────────

  async saveGithub(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
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

      return res.json({
        success: true,
        message: "Legacy GitHub integration settings saved. Note: GitHub App is the recommended integration method.",
        settings,
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },

  async testGithub(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      if (!orgId) {
        return res.status(400).json({ success: false, error: "Organization context required." });
      }
      const result = await integrationSettingsService.testGithubConnection(orgId);
      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  },
};
