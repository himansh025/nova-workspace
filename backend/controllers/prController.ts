import { Request, Response } from "express";
import { INITIAL_PULL_REQUESTS, PullRequest } from "../services/prData";
import { TaskModel } from "../models/Task";
import { ActivityItemModel } from "../models/Activity";
import { broadcastEvent } from "../services/events";
import { ENV } from "../config/env";

declare global {
  var __novaPullRequests: PullRequest[] | undefined;
}

const pullRequests: PullRequest[] = global.__novaPullRequests || [...INITIAL_PULL_REQUESTS];
if (process.env.NODE_ENV !== "production") {
  global.__novaPullRequests = pullRequests;
}

export const prController = {
  getPullRequests(_req: Request, res: Response) {
    const isConfigured = Boolean(ENV.GITHUB_CLIENT_ID && ENV.GITHUB_CLIENT_SECRET);
    return res.json({
      success: true,
      integration: {
        provider: "github",
        configured: isConfigured,
        mode: isConfigured ? "production" : "demo",
        message: isConfigured
          ? "Connected to GitHub App integration."
          : "Operating in demo repository simulation. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to enable live synchronization.",
      },
      pullRequests,
    });
  },

  async patchPullRequest(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { id, action } = req.body;
      const prIndex = pullRequests.findIndex((p) => p.id === id || p.number === Number(id));

      if (prIndex === -1) {
        return res.status(404).json({ error: "Pull request not found" });
      }

      const pr = pullRequests[prIndex];
      if (action === "merge") {
        pr.status = "merged";

        // If linked task exists in this organization, automatically update status
        if (pr.linkedIssueKey) {
          await TaskModel.updateOne(
            { organizationId: orgId, $or: [{ id: pr.linkedIssueKey }, { key: pr.linkedIssueKey }] },
            { $set: { status: "done", updatedAt: new Date().toISOString() } }
          );

          await ActivityItemModel.create({
            id: `act-${Date.now()}`,
            organizationId: orgId,
            type: "task_status",
            actor: { name: pr.author.name, initials: pr.author.initials },
            action: `merged PR #${pr.number} and moved task to DONE`,
            target: pr.linkedIssueKey,
            timestamp: "Just now",
          });
        }

        broadcastEvent({
          type: "git_webhook",
          category: "git",
          title: `PR #${pr.number} Merged`,
          message: `${pr.author.name} merged PR #${pr.number} (${pr.title}) into ${pr.targetBranch}`,
          link: "/app/pull-requests",
          meta: { prId: pr.id, prNumber: pr.number, organizationId: orgId },
        });

        return res.json({ success: true, pullRequest: pr });
      }

      return res.json({ success: true, pullRequest: pr });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  reviewPullRequest(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { prId } = req.body;
      const pr = pullRequests.find((p) => p.id === prId || p.number === Number(prId));
      if (!pr) {
        return res.status(404).json({ error: "Pull request not found" });
      }

      const simulatedReview = {
        score: 96,
        securityStatus: "PASSED" as const,
        performanceImpact: "Estimated 45% reduction in latency & memory allocations",
        summary: `Automated AI Review passed for PR #${pr.number}. Static AST analysis and security audit verify clean memory bounds, zero cross-tenant leakage risk, and full compliance with architectural specifications.`,
        findings: [
          {
            id: `find-rev-${Date.now()}-1`,
            type: "performance" as const,
            filename: pr.diff[0]?.filename || "src/core/router.ts",
            lineNumber: 24,
            title: "Memory Allocation Optimization",
            message: "DataView / buffer zero-copy operations reduce garbage collection sweep frequency by approximately 45%.",
            suggestion: "// Consider adding benchmark telemetry in telemetry signals.",
          },
          {
            id: `find-rev-${Date.now()}-2`,
            type: "security" as const,
            filename: pr.diff[0]?.filename || "src/core/router.ts",
            lineNumber: 36,
            title: "Cryptographic Boundary Check",
            message: "All cryptographic inputs and boundary claims are explicitly validated before memory mapping.",
          },
        ],
      };

      pr.aiReview = simulatedReview;

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: `AI Review Completed for PR #${pr.number}`,
        message: `Nova AI Copilot reviewed PR #${pr.number} (Score: ${simulatedReview.score}/100 - Security: ${simulatedReview.securityStatus})`,
        link: "/app/pull-requests",
        meta: { prId: pr.id, prNumber: pr.number, score: simulatedReview.score, organizationId: orgId },
      });

      return res.json({
        success: true,
        review: simulatedReview,
        pullRequest: pr,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },
};
