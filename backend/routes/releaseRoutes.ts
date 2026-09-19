import { Router } from "express";
import { releaseController } from "../controllers/releaseController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", releaseController.getReleases);
router.patch("/", releaseController.updateRelease);
router.post("/", releaseController.updateRelease);

export default router;
