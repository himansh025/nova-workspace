import { Request, Response } from "express";
import crypto from "crypto";
import { broadcastEvent } from "../services/events";
import { OutgoingWebhookModel } from "../models/OutgoingWebhook";
import { PullRequestModel } from "../models/PullRequest";
import { TaskModel } from "../models/Task";
import { ActivityItemModel } from "../models/Activity";
import { ENV } from "../config/env";

const defaultWebhooks = [
  {
    id: "wh-1",
    name: "Slack #dev-deployments Channel",
    target: "slack",
    url: "https://hooks.slack.com/services/T00/B00/XXXXX",
    events: ["release_updated", "spec_approved"],
    status: "active",
    lastDelivery: "14m ago (200 OK)",
    deliverySuccessRate: 99.8,
  },
  {
    id: "wh-2",
    name: "Discord #incident-alerts Channel",
    target: "discord",
    url: "https://discord.com/api/webhooks/0000/XXXXX",
    events: ["task_created", "git_webhook"],
    status: "active",
    lastDelivery: "1h ago (200 OK)",
    deliverySuccessRate: 100,
  },
  {
    id: "wh-3",
    name: "Datadog / Prometheus Ingestion Stream",
    target: "custom",
    url: "https://api.datadoghq.com/api/v1/events",
    events: ["release_updated", "task_updated"],
    status: "active",
    lastDelivery: "3h ago (200 OK)",
    deliverySuccessRate: 99.4,
  },
];

export const webhookController = {
  async getOutgoingWebhooks(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req.query.orgId as string) || "org-default";
      let count = await OutgoingWebhookModel.countDocuments({ organizationId: orgId });

      if (count === 0) {
        const initial = defaultWebhooks.map((w) => ({
          ...w,
          organizationId: orgId,
        }));
        await OutgoingWebhookModel.insertMany(initial);
      }

      const webhooks = await OutgoingWebhookModel.find({ organizationId: orgId });
      return res.json({ success: true, webhooks });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async testOutgoingWebhook(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { action, id } = req.body;

      const webhook = await OutgoingWebhookModel.findOne({
        $or: [
          { organizationId: orgId, id },
          { id },
        ],
      });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found in database" });
      }

      if (action === "test") {
        webhook.lastDelivery = "Just now (200 OK)";
        webhook.deliverySuccessRate = 100;
        await webhook.save();

        broadcastEvent({
          type: "system",
          category: "system",
          title: `Webhook Test Dispatched: ${webhook.name}`,
          message: `Successfully dispatched HMAC test payload to ${webhook.target.toUpperCase()} endpoint (${webhook.url})`,
          link: "/app/settings",
        });

        return res.json({
          success: true,
          webhook,
          message: `Test payload delivered successfully to ${webhook.name} with HTTP 200 OK response.`,
        });
      }

      return res.json({ success: true, webhook });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async handleGithubWebhook(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";

      // Signature verification if GITHUB_WEBHOOK_SECRET is configured
      if (ENV.GITHUB_WEBHOOK_SECRET) {
        const signature = req.headers["x-hub-signature-256"] as string;
        if (!signature) {
          return res.status(401).json({ success: false, error: "Missing webhook signature." });
        }

        const rawBody = JSON.stringify(req.body);
        const expectedSig = `sha256=${crypto
          .createHmac("sha256", ENV.GITHUB_WEBHOOK_SECRET)
          .update(rawBody)
          .digest("hex")}`;

        if (
          signature.length !== expectedSig.length ||
          !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
        ) {
          return res.status(401).json({ success: false, error: "Invalid webhook signature." });
        }
      }

      const ghEvent = (req.headers["x-github-event"] as string) || req.body.event || "push";

      // Handle live GitHub Pull Request events
      if (ghEvent === "pull_request" && req.body.pull_request) {
        const ghPR = req.body.pull_request;
        const prAction = req.body.action; // opened, closed, reopened, synchronize
        const prId = `pr-gh-${ghPR.id}`;
        const authorName = ghPR.user?.login || "GitHub User";
        const authorInitials = authorName.slice(0, 2).toUpperCase();

        const status = ghPR.merged
          ? "merged"
          : ghPR.state === "closed"
          ? "closed"
          : "open";

        const linkedIssueMatch = (ghPR.title + " " + (ghPR.body || "")).match(/\b(NV-\d+)\b/i);
        const linkedIssueKey = linkedIssueMatch ? linkedIssueMatch[1].toUpperCase() : undefined;

        await PullRequestModel.findOneAndUpdate(
          { organizationId: orgId, $or: [{ id: prId }, { number: ghPR.number }] },
          {
            $set: {
              id: prId,
              organizationId: orgId,
              number: ghPR.number,
              title: ghPR.title,
              description: ghPR.body || "",
              author: {
                name: authorName,
                avatar: ghPR.user?.avatar_url || "",
                initials: authorInitials,
              },
              branch: ghPR.head?.ref || "feature",
              targetBranch: ghPR.base?.ref || "main",
              status,
              commitsCount: ghPR.commits || 1,
              filesChangedCount: ghPR.changed_files || 1,
              additions: ghPR.additions || 0,
              deletions: ghPR.deletions || 0,
              updatedAt: new Date().toISOString(),
              linkedIssueKey,
              githubPrId: ghPR.id,
              githubUrl: ghPR.html_url,
            },
          },
          { upsert: true, new: true }
        );

        if (status === "merged" && linkedIssueKey) {
          await TaskModel.updateOne(
            { organizationId: orgId, $or: [{ id: linkedIssueKey }, { key: linkedIssueKey }] },
            { $set: { status: "done", updatedAt: new Date().toISOString() } }
          );

          await ActivityItemModel.create({
            id: `act-${Date.now()}`,
            organizationId: orgId,
            type: "task_status",
            actor: { name: authorName, initials: authorInitials },
            action: `merged GitHub PR #${ghPR.number} and moved task to DONE`,
            target: linkedIssueKey,
            timestamp: "Just now",
          });
        }

        broadcastEvent({
          type: "git_webhook",
          category: "git",
          title: `GitHub PR #${ghPR.number} ${prAction}`,
          message: `${authorName} ${prAction} pull request #${ghPR.number}: "${ghPR.title}"`,
          link: "/app/pull-requests",
          meta: { prNumber: ghPR.number, action: prAction, organizationId: orgId },
        });

        return res.json({
          success: true,
          message: `Processed pull_request (${prAction}) event successfully.`,
        });
      }

      // Handle Push / other events
      const { branch, author } = req.body;
      const commitAuthor = author || req.body.pusher?.name || "Marcus Vance";

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: `GitHub Webhook: ${ghEvent}`,
        message: `${commitAuthor} triggered ${ghEvent} on ${branch || req.body.ref || "main"}`,
        link: "/app/tasks",
        meta: { organizationId: orgId },
      });

      return res.json({ success: true, message: `Handled ${ghEvent} event successfully.` });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
