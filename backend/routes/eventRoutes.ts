import { Router, Request, Response } from "express";
import { subscribeToEvents, getNotificationHistory } from "../services/events";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  // If client requests poll mode or sends Accept: application/json, respond immediately with JSON
  if (req.query.poll === "true" || req.headers.accept?.includes("application/json")) {
    return res.json({
      success: true,
      type: "init",
      history: getNotificationHistory(),
      connectedAt: new Date().toISOString(),
    });
  }

  // Set SSE Headers with no-buffering for proxies & Vercel
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform, no-store",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();

  // Send initial event history frame immediately
  res.write(
    `data: ${JSON.stringify({
      type: "init",
      history: getNotificationHistory(),
      connectedAt: new Date().toISOString(),
    })}\n\n`
  );
  if (typeof (res as any).flush === "function") {
    (res as any).flush();
  }

  const unsubscribe = subscribeToEvents((event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    } catch {}
  });

  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    } catch {}
  }, 12000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

export default router;
