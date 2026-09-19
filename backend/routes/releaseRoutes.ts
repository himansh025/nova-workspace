import { Router } from "express";
import { releaseController } from "../controllers/releaseController";

const router = Router();

router.get("/", releaseController.getReleases);
router.put("/", releaseController.updateRelease);
router.patch("/", releaseController.updateRelease);

export default router;
