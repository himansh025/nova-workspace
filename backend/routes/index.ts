import { Router } from "express";
import authRoutes from "./authRoutes";
import taskRoutes from "./taskRoutes";
import sprintRoutes from "./sprintRoutes";
import prRoutes from "./prRoutes";
import specRoutes from "./specRoutes";
import meshRoutes from "./meshRoutes";
import releaseRoutes from "./releaseRoutes";
import teamRoutes from "./teamRoutes";
import projectRoutes from "./projectRoutes";
import webhookRoutes from "./webhookRoutes";
import eventRoutes from "./eventRoutes";
import systemRoutes from "./systemRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/sprints", sprintRoutes);
router.use("/", prRoutes); // /api/pull-requests & /api/ai/review-pr
router.use("/specs", specRoutes);
router.use("/architecture", meshRoutes);
router.use("/releases", releaseRoutes);
router.use("/team", teamRoutes);
router.use("/projects", projectRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/events", eventRoutes);
router.use("/", systemRoutes); // /api/analytics, /api/activity, /api/ai/*, /api/reset

export default router;
