import { Request, Response } from "express";
import {
  githubRepositoryExplorerService,
  GitHubExplorerError,
} from "../services/githubRepositoryExplorerService";
import { repositoryContextService } from "../services/repositoryContextService";

function handleExplorerError(res: Response, err: any) {
  if (err instanceof GitHubExplorerError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  const message = err.message || "An unexpected repository explorer error occurred.";
  return res.status(400).json({
    success: false,
    error: message,
    code: "BAD_REQUEST",
  });
}

export const repositoryExplorerController = {
  /**
   * GET /api/integrations/github/repositories/:repositoryId
   */
  async getMetadata(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const metadata = await githubRepositoryExplorerService.getRepositoryMetadata(
        orgId,
        repositoryId
      );

      return res.json({
        success: true,
        repository: metadata,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/branches
   */
  async getBranches(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { page, perPage } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.listBranches(
        orgId,
        repositoryId,
        Number(page) || 1,
        Number(perPage) || 100
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/tree
   */
  async getTree(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { branch, path: dirPath, page, perPage } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.getTree(
        orgId,
        repositoryId,
        branch as string | undefined,
        dirPath as string | undefined,
        Number(page) || 1,
        Number(perPage) || 100
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/file
   */
  async getFile(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { branch, path: filePath } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.getFile(
        orgId,
        repositoryId,
        branch as string | undefined,
        filePath as string | undefined
      );

      return res.json({
        success: true,
        file: result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/search
   */
  async searchCode(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { q, branch, page, perPage } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.searchCode(
        orgId,
        repositoryId,
        q as string,
        branch as string | undefined,
        Number(page) || 1,
        Number(perPage) || 30
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/commits
   */
  async getCommits(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { branch, page, perPage, path: filePath } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.getCommits(
        orgId,
        repositoryId,
        branch as string | undefined,
        Number(page) || 1,
        Number(perPage) || 30,
        filePath as string | undefined
      );

      return res.json({
        success: true,
        ...result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/commits/:sha
   */
  async getCommit(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const sha = String(req.params.sha || "");

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await githubRepositoryExplorerService.getCommit(
        orgId,
        repositoryId,
        sha
      );

      return res.json({
        success: true,
        commit: result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },

  /**
   * GET /api/integrations/github/repositories/:repositoryId/overview
   */
  async getOverview(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const repositoryId = String(req.params.repositoryId || "");
      const { branch } = req.query;

      if (!orgId) {
        return res.status(401).json({ success: false, error: "Organization context required." });
      }

      const result = await repositoryContextService.getRepositoryOverview(
        orgId,
        repositoryId,
        branch as string | undefined
      );

      return res.json({
        success: true,
        overview: result,
      });
    } catch (err: any) {
      return handleExplorerError(res, err);
    }
  },
};
