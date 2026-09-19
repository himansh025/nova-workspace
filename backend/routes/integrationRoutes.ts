import { Router } from "express";
import { integrationController } from "../controllers/integrationController";
import { authGuard, requireOrg, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(authGuard);
router.use(requireOrg);

router.get("/", integrationController.getSettings);
router.post("/smtp", requirePermission("integration:manage"), integrationController.saveSmtp);
router.post("/smtp/test", requirePermission("integration:manage"), integrationController.testSmtp);
router.post("/github", requirePermission("integration:manage"), integrationController.saveGithub);
router.post("/github/test", requirePermission("integration:manage"), integrationController.testGithub);

export default router;
