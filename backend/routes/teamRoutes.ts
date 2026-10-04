import { Router } from "express";
import { teamController } from "../controllers/teamController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/groups", teamController.getGroups);
router.post("/groups", teamController.createGroup);
router.patch("/groups/:id", teamController.updateGroup);
router.delete("/groups/:id", teamController.deleteGroup);

router.get("/", teamController.getTeam);
router.post("/", teamController.addMember);
router.patch("/:id", teamController.updateMember);
router.delete("/:id", teamController.deleteMember);

export default router;
