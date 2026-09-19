import { Router } from "express";
import { teamController } from "../controllers/teamController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", teamController.getTeam);
router.post("/", teamController.addMember);

export default router;
