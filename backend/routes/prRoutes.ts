import { Router } from "express";
import { prController } from "../controllers/prController";
import { authGuard, requireOrg } from "../middlewares/auth";

const router = Router();

// Strictly require authenticated session and organization context for all PR operations
router.get("/pull-requests", authGuard, requireOrg, prController.getPullRequests);
router.post("/pull-requests/sync", authGuard, requireOrg, prController.syncPullRequests);
router.patch("/pull-requests", authGuard, requireOrg, prController.patchPullRequest);
router.delete("/pull-requests/:id", authGuard, requireOrg, prController.deletePullRequest);
router.delete("/pull-requests", authGuard, requireOrg, prController.deletePullRequest);
router.post("/ai/review-pr", authGuard, requireOrg, prController.reviewPullRequest);

export default router;
