import { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { agentService } from "../services/agentService";

function getUserId(req: Request): string {
  const user = (req as any).user;
  return user?.id || (req as any).userId || "";
}

export const agentRunLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AGENT_RATE_LIMIT_MAX || 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many agent runs. Please try again later.",
  },
});

export const agentController = {
  async createRun(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = getUserId(req);
      const { repositoryId, task, branch, model } = req.body;

      const run = await agentService.createRun(orgId, userId, {
        repositoryId,
        task,
        branch,
        model,
      });

      return res.status(201).json({ success: true, run });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },

  async getRun(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = getUserId(req);
      const id = String(req.params.id);
      const run = await agentService.getRun(orgId, userId, id);
      return res.json({ success: true, run });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },

  async cancelRun(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = getUserId(req);
      const id = String(req.params.id);
      const run = await agentService.cancelRun(orgId, userId, id);
      return res.json({ success: true, run });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },

  async getPlan(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId;
      const userId = getUserId(req);
      const id = String(req.params.id);
      const plan = await agentService.getPlan(orgId, userId, id);
      return res.json({ success: true, ...plan });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({ success: false, error: err.message });
    }
  },
};
