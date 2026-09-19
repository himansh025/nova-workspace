import { Router } from "express";
import { projectController } from "../controllers/projectController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);

export default router;
