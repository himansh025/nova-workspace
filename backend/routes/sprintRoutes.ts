import { Router } from "express";
import { sprintController } from "../controllers/sprintController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", sprintController.getSprints);
router.post("/", sprintController.createSprint);
router.post("/poker", sprintController.castVote);
router.post("/assign", sprintController.assignTask);
router.post("/:id/start", sprintController.startSprint);
router.post("/:id/complete", sprintController.completeSprint);
router.patch("/:id", sprintController.updateOrAssignSprint);
router.delete("/:id", sprintController.deleteSprint);

export default router;
