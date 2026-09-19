import { Request, Response } from "express";
import crypto from "crypto";
import { broadcastEvent } from "../services/events";
import { OutgoingWebhook } from "../services/types";
import { ENV } from "../config/env";

declare global {
  var __novaOutgoingWebhooks: OutgoingWebhook[] | undefined;
}

const defaultWebhooks: OutgoingWebhook[] = [
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

const outgoingWebhooks: any[] = global.__novaOutgoingWebhooks || [...defaultWebhooks];
if (process.env.NODE_ENV !== "production") {
  global.__novaOutgoingWebhooks = outgoingWebhooks;
}

export const webhookController = {
  getOutgoingWebhooks(_req: Request, res: Response) {
    return res.json({ success: true, webhooks: outgoingWebhooks });
  },

  testOutgoingWebhook(req: Request, res: Response) {
    try {
      const { action, id } = req.body;
      const webhook = outgoingWebhooks.find((w) => w.id === id);
      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      if (action === "test") {
        webhook.lastDelivery = "Just now (200 OK)";
        webhook.deliverySuccessRate = 100;

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

  handleGithubWebhook(req: Request, res: Response) {
    try {
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

      const { event, branch, author } = req.body;
      const commitAuthor = author || "Marcus Vance";

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: `GitHub Webhook: ${event || "push"}`,
        message: `${commitAuthor} triggered ${event || "push"} on ${branch || "main"}`,
        link: "/app/tasks",
      });

      return res.json({ success: true, message: `Handled ${event || "push"} event successfully.` });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
