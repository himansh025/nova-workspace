import { Router } from "express";
import { sprintController } from "../controllers/sprintController";

const router = Router();

router.get("/", sprintController.getSprints);
router.post("/", sprintController.postAction);
router.get("/poker", sprintController.getPoker);
router.post("/poker", sprintController.castPoker);
router.get("/:id", sprintController.getSprint);
router.patch("/:id", sprintController.patchSprint);
router.post("/:id/complete", sprintController.completeSprint);

export default router;
