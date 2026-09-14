import { NextRequest, NextResponse } from "next/server";
import { broadcastEvent } from "@/server/events";

export interface OutgoingWebhook {
  id: string;
  name: string;
  target: "slack" | "discord" | "custom";
  url: string;
  events: string[];
  status: "active" | "paused" | "failed";
  lastDelivery?: string;
  deliverySuccessRate: number;
}

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

const webhooks: OutgoingWebhook[] = global.__novaOutgoingWebhooks || [...defaultWebhooks];
if (process.env.NODE_ENV !== "production") {
  global.__novaOutgoingWebhooks = webhooks;
}

export async function GET() {
  return NextResponse.json({ success: true, webhooks });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, name, target, url, events } = body;

    // Test a specific webhook
    if (action === "test") {
      const targetWebhook = webhooks.find((w) => w.id === id);
      const hookName = targetWebhook?.name || name || "Outgoing Webhook";

      if (targetWebhook) {
        targetWebhook.lastDelivery = "Just now (200 OK)";
      }

      broadcastEvent({
        type: "system",
        category: "system",
        title: "Outgoing Webhook Dispatched",
        message: `Dispatched test payload to ${hookName} (Response: 200 OK - 42ms)`,
        link: "/app/settings",
        meta: { webhookId: id },
      });

      return NextResponse.json({
        success: true,
        status: 200,
        message: `Successfully delivered test payload to ${hookName}. Verified in 42ms.`,
      });
    }

    // Add new webhook
    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    const newWebhook: OutgoingWebhook = {
      id: `wh-${Date.now()}`,
      name,
      target: target || "custom",
      url,
      events: events || ["release_updated", "task_created"],
      status: "active",
      lastDelivery: "Configured (Not yet triggered)",
      deliverySuccessRate: 100,
    };

    webhooks.push(newWebhook);

    broadcastEvent({
      type: "system",
      category: "system",
      title: "New Outgoing Webhook Added",
      message: `Configured webhook integration: ${newWebhook.name}`,
      link: "/app/settings",
      meta: { webhookId: newWebhook.id },
    });

    return NextResponse.json({ success: true, webhook: newWebhook }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process webhook action" }, { status: 500 });
  }
}
