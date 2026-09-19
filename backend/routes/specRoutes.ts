import { Router } from "express";
import { specController } from "../controllers/specController";
import { authGuard } from "../middlewares/auth";

const router = Router();

router.use(authGuard);

router.get("/", specController.getSpecs);
router.post("/", specController.createSpec);
router.get("/:id", specController.getSpecById);
router.get("/:id/revisions", specController.getRevisions);
router.put("/:id", specController.updateSpec);
router.patch("/:id", specController.updateSpec);
router.delete("/:id", specController.deleteSpec);

export default router;
