import { Router } from "express";
import { taskController } from "../controllers/taskController";
import { authGuard, requirePermission } from "../middlewares/auth";

const router = Router();

// Protect all task endpoints with authGuard
router.use(authGuard);

router.get("/", taskController.getTasks);
router.post("/", requirePermission("task:create"), taskController.createTask);
router.put("/:id", requirePermission("task:update"), taskController.updateTask);
router.patch("/:id", requirePermission("task:update"), taskController.updateTask);
router.delete("/:id", requirePermission("task:delete"), taskController.deleteTask);

export default router;
