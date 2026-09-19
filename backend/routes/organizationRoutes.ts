import { Router } from "express";
import { organizationController } from "../controllers/organizationController";
import { authGuard, requirePermission } from "../middlewares/auth";

const router = Router();

// All organization routes require authentication
router.use(authGuard);

router.get("/", organizationController.getActive);
router.get("/list", organizationController.listUserOrgs);
router.post("/", organizationController.create);
router.get("/members", organizationController.listMembers);
router.post("/members", requirePermission("team:manage"), organizationController.addMember);
router.delete("/members/:userId", requirePermission("team:manage"), organizationController.removeMember);

export default router;
