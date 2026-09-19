import { Router } from "express";
import { taskController } from "../controllers/taskController";
import { authGuard } from "../middlewares/auth";

const router = Router();

// Protect all task endpoints with authGuard
router.use(authGuard);

router.get("/", taskController.getTasks);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
