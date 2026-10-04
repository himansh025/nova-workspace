import { Router } from "express";
import { teamController } from "../controllers/teamController";
import { authGuard, optionalAuth } from "../middlewares/auth";

const router = Router();

router.get("/invites/:token", teamController.getInvite);
router.post("/invites/accept", optionalAuth, teamController.acceptInvite);

router.use(authGuard);

router.get("/my-invites", teamController.getMyInvites);
router.post("/invites/accept-authenticated", teamController.acceptInviteAuthenticated);

router.get("/groups", teamController.getGroups);
router.post("/groups", teamController.createGroup);
router.patch("/groups/:id", teamController.updateGroup);
router.delete("/groups/:id", teamController.deleteGroup);

router.get("/", teamController.getTeam);
router.post("/", teamController.addMember);
router.post("/:id/resend-invite", teamController.resendInvite);
router.patch("/:id", teamController.updateMember);
router.delete("/:id", teamController.deleteMember);

export default router;
