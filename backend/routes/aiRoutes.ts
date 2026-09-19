import { Router } from "express";
import { aiController } from "../controllers/aiController";
import { authGuard, requireOrg, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(authGuard);
router.use(requireOrg);

router.get("/settings", aiController.getSettings);
router.post("/settings", requirePermission("ai:manage"), aiController.saveSettings);
router.get("/models", aiController.fetchModels);
router.post("/chat", requirePermission("ai:use"), aiController.chat);
router.post("/generate-code", requirePermission("ai:use"), aiController.generateCode);

export default router;
