import { Router } from "express";
import { prController } from "../controllers/prController";

const router = Router();

router.get("/pull-requests", prController.getPullRequests);
router.post("/pull-requests/sync", prController.syncPullRequests);
router.patch("/pull-requests", prController.patchPullRequest);
router.post("/ai/review-pr", prController.reviewPullRequest);

export default router;
