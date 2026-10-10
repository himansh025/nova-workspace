import { Router } from "express";
import { organizationController } from "../controllers/organizationController";
import { authGuard, requirePermission, requireOrg } from "../middlewares/auth";

const router = Router();

// All organization routes require authentication
router.use(authGuard);

router.get("/", organizationController.getActive);
router.patch("/", requireOrg, requirePermission("organization:manage"), organizationController.update);
router.delete("/", requireOrg, requirePermission("organization:manage"), organizationController.deleteOrg);
router.get("/list", organizationController.listUserOrgs);
router.post("/", organizationController.create);
router.get("/permissions/catalog", organizationController.permissionCatalog);
router.get("/members", organizationController.listMembers);
router.post("/members", requirePermission("team:manage"), organizationController.addMember);
router.patch("/members/:userId", requirePermission("organization:manage"), organizationController.updateMember);
router.delete("/members/:userId", requirePermission("team:manage"), organizationController.removeMember);

export default router;
