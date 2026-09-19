import { Router } from "express";
import { systemController } from "../controllers/systemController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.get("/analytics", authGuard, systemController.getAnalytics);
router.get("/activity", authGuard, systemController.getActivity);
router.post("/ai/chat", authGuard, systemController.aiChat);
router.post("/ai/generate-code", authGuard, systemController.aiGenerateCode);
router.get("/notifications", authGuard, systemController.getNotifications);
router.patch("/notifications/:id/read", authGuard, systemController.markNotificationRead);
router.post("/notifications/mark-all-read", authGuard, systemController.markAllNotificationsRead);

export default router;
