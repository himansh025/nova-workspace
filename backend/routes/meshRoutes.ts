import { Router } from "express";
import { meshController } from "../controllers/meshController";

const router = Router();

router.get("/", meshController.getTopology);
router.post("/", meshController.diagnoseNode);

export default router;
