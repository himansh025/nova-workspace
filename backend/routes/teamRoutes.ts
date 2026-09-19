import { Router } from "express";
import { teamController } from "../controllers/teamController";

const router = Router();

router.get("/", teamController.getTeam);
router.post("/", teamController.addMember);

export default router;
