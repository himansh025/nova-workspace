import { Router } from "express";
import { projectController } from "../controllers/projectController";
import { authGuard, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", projectController.getProjects);
router.post("/", requirePermission("project:write"), projectController.createProject);
router.patch("/:id", requirePermission("project:write"), projectController.updateProject);
router.delete("/:id", requirePermission("project:write"), projectController.deleteProject);

export default router;
