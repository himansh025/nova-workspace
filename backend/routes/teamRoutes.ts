import { Router } from "express";
import { teamController } from "../controllers/teamController";
import { authGuard, optionalAuth, requirePermission } from "../middlewares/auth";

const router = Router();

router.get("/invites/:token", teamController.getInvite);
router.post("/invites/accept", optionalAuth, teamController.acceptInvite);

router.use(authGuard);

router.get("/my-invites", teamController.getMyInvites);
router.post("/invites/accept-authenticated", teamController.acceptInviteAuthenticated);

router.get("/groups", teamController.getGroups);
router.post("/groups", requirePermission("team:manage"), teamController.createGroup);
router.patch("/groups/:id", requirePermission("team:manage"), teamController.updateGroup);
router.delete("/groups/:id", requirePermission("team:manage"), teamController.deleteGroup);

router.get("/", teamController.getTeam);
router.post("/", requirePermission("team:manage"), teamController.addMember);
router.post("/:id/resend-invite", requirePermission("team:manage"), teamController.resendInvite);
router.patch("/:id", requirePermission("team:manage"), teamController.updateMember);
router.delete("/:id", requirePermission("team:manage"), teamController.deleteMember);

export default router;
