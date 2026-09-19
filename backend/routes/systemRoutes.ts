import { Router } from "express";
import { systemController } from "../controllers/systemController";

const router = Router();

router.get("/analytics", systemController.getAnalytics);
router.get("/activity", systemController.getActivity);
router.post("/ai/chat", systemController.aiChat);
router.post("/ai/generate-code", systemController.aiGenerateCode);
router.post("/reset", systemController.resetDatabase);

export default router;
