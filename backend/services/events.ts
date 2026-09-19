import { EventEmitter } from "events";

export interface RealtimeEvent {
  id: string;
  type: "task_created" | "task_updated" | "task_deleted" | "spec_approved" | "spec_updated" | "release_updated" | "git_webhook" | "system";
  category: "tasks" | "specs" | "releases" | "git" | "system";
  title: string;
  message: string;
  timestamp: string;
  link?: string;
  meta?: Record<string, any>;
}

// Global EventEmitter singleton across hot-reloads
declare global {
  var __novaEventEmitter: EventEmitter | undefined;
  var __novaNotificationHistory: RealtimeEvent[] | undefined;
}

const eventEmitter: EventEmitter = global.__novaEventEmitter || new EventEmitter();
eventEmitter.setMaxListeners(100);
if (process.env.NODE_ENV !== "production") {
  global.__novaEventEmitter = eventEmitter;
}

const notificationHistory: RealtimeEvent[] = global.__novaNotificationHistory || [
  {
    id: "notif-init-1",
    type: "git_webhook",
    category: "git",
    title: "Git Commit Synced",
    message: "Marcus Chen pushed commit 7b23f1e to fix/offline-sync",
    timestamp: "10m ago",
    link: "/app/tasks",
  },
  {
    id: "notif-init-2",
    type: "release_updated",
    category: "releases",
    title: "Canary Rollout Updated",
    message: "Production canary traffic promoted to 25%",
    timestamp: "25m ago",
    link: "/app/releases",
  },
  {
    id: "notif-init-3",
    type: "spec_approved",
    category: "specs",
    title: "Architecture Spec Approved",
    message: "SPEC-104 (CRDT State Sync Protocol) was officially approved",
    timestamp: "1h ago",
    link: "/app/specs",
  },
];
if (process.env.NODE_ENV !== "production") {
  global.__novaNotificationHistory = notificationHistory;
}

export function broadcastEvent(event: Omit<RealtimeEvent, "id" | "timestamp">) {
  const fullEvent: RealtimeEvent = {
    ...event,
    id: `ev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };

  notificationHistory.unshift(fullEvent);
  if (notificationHistory.length > 50) {
    notificationHistory.pop();
  }

  eventEmitter.emit("nova_event", fullEvent);
  return fullEvent;
}

export function subscribeToEvents(callback: (event: RealtimeEvent) => void) {
  eventEmitter.on("nova_event", callback);
  return () => {
    eventEmitter.off("nova_event", callback);
  };
}

export function getNotificationHistory(): RealtimeEvent[] {
  return [...notificationHistory];
}
