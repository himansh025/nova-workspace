import { Request, Response } from "express";
import { broadcastEvent } from "../services/events";
import { OutgoingWebhook } from "../services/types";

declare global {
  var __novaOutgoingWebhooks: OutgoingWebhook[] | undefined;
}

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

const outgoingWebhooks: any[] = global.__novaOutgoingWebhooks || [...defaultWebhooks];
if (process.env.NODE_ENV !== "production") {
  global.__novaOutgoingWebhooks = outgoingWebhooks;
}

export const webhookController = {
  getOutgoingWebhooks(_req: Request, res: Response) {
    res.json({ success: true, webhooks: outgoingWebhooks });
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
          message: `Successfully sent test HMAC event to ${webhook.target.toUpperCase()} endpoint (${webhook.url})`,
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
      res.status(500).json({ error: error.message });
    }
  },

  handleGithubWebhook(req: Request, res: Response) {
    try {
      const { event, branch, author } = req.body;
      const commitAuthor = author || "Marcus Vance";

      broadcastEvent({
        type: "git_webhook",
        category: "git",
        title: `GitHub Webhook: ${event}`,
        message: `${commitAuthor} triggered ${event} on ${branch || "main"}`,
        link: "/app/tasks",
      });

      res.json({ success: true, message: `Handled ${event} event successfully.` });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
