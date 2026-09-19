import { Router } from "express";
import { webhookController } from "../controllers/webhookController";

const router = Router();

router.get("/outgoing", webhookController.getOutgoingWebhooks);
router.post("/outgoing", webhookController.testOutgoingWebhook);
router.post("/github", webhookController.handleGithubWebhook);

export default router;
