import { Router } from "express";
import { projectController } from "../controllers/projectController";

const router = Router();

router.get("/", projectController.getProjects);
router.post("/", projectController.createProject);

export default router;
