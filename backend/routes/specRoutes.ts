import { Router } from "express";
import { specController } from "../controllers/specController";

const router = Router();

router.get("/", specController.getSpecs);
router.post("/", specController.createSpec);
router.put("/:id", specController.updateSpec);
router.patch("/:id", specController.updateSpec);

export default router;
