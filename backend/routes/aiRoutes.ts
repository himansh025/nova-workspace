import { Router } from "express";
import { aiController } from "../controllers/aiController";
import { authGuard, requireOrg, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(authGuard);
router.use(requireOrg);

// Settings and Models
router.get("/settings", aiController.getSettings);
router.post("/settings", requirePermission("ai:manage"), aiController.saveSettings);
router.post("/settings/test", requirePermission("ai:manage"), aiController.testCredentials);
router.get("/models", aiController.fetchModels);

// Conversations
router.get("/conversations", aiController.listConversations);
router.post("/conversations", requirePermission("ai:use"), aiController.createConversation);
router.get("/conversations/:id", aiController.getConversation);
router.delete("/conversations/:id", requirePermission("ai:use"), aiController.deleteConversation);

// Chat & Streaming
router.post("/chat", requirePermission("ai:use"), aiController.chat);
router.post("/chat/stream", requirePermission("ai:use"), aiController.chatStream);

// Specification code generation (legacy compatibility)
router.post("/generate-code", requirePermission("ai:use"), aiController.generateCode);

export default router;
