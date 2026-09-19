import { Router, Request, Response } from "express";
import { subscribeToEvents, getNotificationHistory } from "../services/events";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Initial event history
  res.write(
    `data: ${JSON.stringify({
      type: "init",
      history: getNotificationHistory(),
      connectedAt: new Date().toISOString(),
    })}\n\n`
  );

  const unsubscribe = subscribeToEvents((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
});

export default router;
