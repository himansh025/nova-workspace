import { Router } from "express";
import { prController } from "../controllers/prController";
import { optionalAuth } from "../middlewares/auth";

const router = Router();

router.use(optionalAuth);

router.get("/pull-requests", prController.getPullRequests);
router.post("/pull-requests/sync", prController.syncPullRequests);
router.patch("/pull-requests", prController.patchPullRequest);
router.delete("/pull-requests/:id", prController.deletePullRequest);
router.delete("/pull-requests", prController.deletePullRequest);
router.post("/ai/review-pr", prController.reviewPullRequest);

export default router;
