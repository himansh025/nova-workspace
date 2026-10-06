import { Router } from "express";
import { integrationController } from "../controllers/integrationController";
import { repositoryExplorerController } from "../controllers/repositoryExplorerController";
import { authGuard, requireOrg, requirePermission } from "../middlewares/auth";

const router = Router();

router.use(authGuard);
router.use(requireOrg);

router.get("/", integrationController.getSettings);
router.post("/smtp", requirePermission("integration:manage"), integrationController.saveSmtp);
router.post("/smtp/test", requirePermission("integration:manage"), integrationController.testSmtp);

// ─── GitHub App Setup & Settings ──────────────────────────────────────────────
router.get("/github/status", integrationController.getGithubAppStatus);
router.get("/github/install-url", requirePermission("integration:manage"), integrationController.getGithubInstallUrl);
router.post("/github/install-callback", requirePermission("integration:manage"), integrationController.handleGithubInstallCallback);
router.get("/github/repositories", integrationController.listGithubRepositories);
router.post("/github/repositories/select", requirePermission("integration:manage"), integrationController.selectGithubRepository);
router.get("/github/branches", integrationController.listGithubBranches);
router.post("/github/branches/select", requirePermission("integration:manage"), integrationController.selectGithubBranch);
router.post("/github/disconnect", requirePermission("integration:manage"), integrationController.disconnectGithub);

// ─── Phase 2: Read-Only Repository Explorer Endpoints ────────────────────────
router.get("/github/repositories/:repositoryId", repositoryExplorerController.getMetadata);
router.get("/github/repositories/:repositoryId/branches", repositoryExplorerController.getBranches);
router.get("/github/repositories/:repositoryId/tree", repositoryExplorerController.getTree);
router.get("/github/repositories/:repositoryId/file", repositoryExplorerController.getFile);
router.get("/github/repositories/:repositoryId/search", repositoryExplorerController.searchCode);
router.get("/github/repositories/:repositoryId/commits", repositoryExplorerController.getCommits);
router.get("/github/repositories/:repositoryId/commits/:sha", repositoryExplorerController.getCommit);
router.get("/github/repositories/:repositoryId/overview", repositoryExplorerController.getOverview);
router.get("/github/repositories/:repositoryId/context", repositoryExplorerController.getOverview);

// ─── Legacy PAT Routes (Deprecated / Dev fallback) ───────────────────────────
router.post("/github", requirePermission("integration:manage"), integrationController.saveGithub);
router.post("/github/test", requirePermission("integration:manage"), integrationController.testGithub);

export default router;
