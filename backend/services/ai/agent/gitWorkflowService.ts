import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { AgentRunModel, IAgentRunDocument } from "../../../models/AgentRun";
import { AGENT_CONFIG } from "./agentConfig";
import { getWorkspaceDir, readWorkspaceFile } from "./agentWorkspaceService";
import { validateAgentFilePath } from "./agentPathUtils";
import { redactSecrets } from "../secretRedactor";
import { collectWorkspaceDiff } from "./agentWorkspaceService";

const PROTECTED_BRANCHES = new Set(["main", "master", "HEAD"]);
const NOVA_BASE_BRANCH = "nova/workspace-base";

export interface IGitCommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

async function runGit(runId: string, args: string[]): Promise<IGitCommandResult> {
  if (args.some((a) => a.includes(";") || a.includes("&&") || a.includes("|"))) {
    throw new Error("Invalid git argument.");
  }
  const cwd = getWorkspaceDir(runId);
  return new Promise((resolve, reject) => {
    const proc = spawn("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0",
        HUSKY: "0",
      },
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > AGENT_CONFIG.gitMaxOutputChars) {
        stdout = stdout.slice(0, AGENT_CONFIG.gitMaxOutputChars);
      }
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > AGENT_CONFIG.gitMaxOutputChars) {
        stderr = stderr.slice(0, AGENT_CONFIG.gitMaxOutputChars);
      }
    });
    proc.on("error", reject);
    proc.on("close", (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
  });
}

export function slugifyTask(task: string, maxLen = 40): string {
  const slug = task
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return slug || "task";
}

export function sanitizeBranchName(name: string): string {
  const clean = name
    .replace(/[^a-zA-Z0-9/._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const base = clean.split("/").pop()?.toLowerCase() || "";
  if (PROTECTED_BRANCHES.has(base) || PROTECTED_BRANCHES.has(clean.toLowerCase())) {
    throw new Error("Branch name cannot target main or master.");
  }
  if (!clean.startsWith("nova/agent/")) {
    throw new Error("Agent branches must be under nova/agent/.");
  }
  if (clean.length > 120) {
    throw new Error("Branch name too long.");
  }
  return clean;
}

export function buildAgentBranchName(runId: string, task: string): string {
  const shortId = runId.replace(/^agent-/, "").slice(0, 8);
  const slug = slugifyTask(task);
  return sanitizeBranchName(`nova/agent/${shortId}-${slug}`);
}

export function generateCommitMessage(task: string, runId: string): string {
  const subject = task.trim().split("\n")[0].slice(0, 72);
  return `feat(agent): ${subject}\n\nNova agent run: ${runId}\n\nAutomated commit from isolated workspace (not pushed).`;
}

async function isGitRepo(runId: string): Promise<boolean> {
  const res = await runGit(runId, ["rev-parse", "--git-dir"]);
  return res.exitCode === 0;
}

export async function ensureGitRepository(runId: string): Promise<void> {
  const root = getWorkspaceDir(runId);
  if (!(await isGitRepo(runId))) {
    let res = await runGit(runId, ["init"]);
    if (res.exitCode !== 0) {
      throw new Error(`git init failed: ${res.stderr}`);
    }
    await runGit(runId, ["checkout", "-B", NOVA_BASE_BRANCH]);
    await runGit(runId, ["config", "user.email", "nova-agent@local"]);
    await runGit(runId, ["config", "user.name", "Nova Agent"]);
  }

  const head = await runGit(runId, ["rev-parse", "HEAD"]);
  if (head.exitCode !== 0) {
    const res = await runGit(runId, ["add", "-A"]);
    if (res.exitCode !== 0) throw new Error(`git add failed: ${res.stderr}`);
    const commit = await runGit(runId, ["commit", "-m", "chore: nova workspace baseline"]);
    if (commit.exitCode !== 0 && !commit.stderr.includes("nothing to commit")) {
      throw new Error(`baseline commit failed: ${commit.stderr}`);
    }
  }
}

async function loadRun(
  runId: string,
  organizationId: string,
  userId: string
): Promise<IAgentRunDocument> {
  const run = await AgentRunModel.findOne({ id: runId, organizationId, userId });
  if (!run) throw new Error("Agent run not found.");
  return run;
}

export function assertGitPreconditions(run: IAgentRunDocument): void {
  if (run.enableVerification && run.verificationStatus !== "passed") {
    throw new Error("Git workflow requires verification to pass first.");
  }
  if (!run.modifiedFiles || run.modifiedFiles.length === 0) {
    throw new Error("No agent-modified files to commit.");
  }
}

async function scanFileForSecrets(runId: string, relPath: string): Promise<void> {
  const file = await readWorkspaceFile(runId, relPath);
  const content = file.content || "";
  const { hasRedactions, redactionCount } = redactSecrets(content);
  if (hasRedactions && redactionCount > 0) {
    throw new Error(`Secret-like content detected in ${relPath}. Commit blocked.`);
  }
}

function allowedPaths(run: IAgentRunDocument): Set<string> {
  return new Set(run.modifiedFiles.map((p) => validateAgentFilePath(p)));
}

export const gitWorkflowService = {
  buildAgentBranchName,
  sanitizeBranchName,
  generateCommitMessage,

  async createBranch(runId: string, organizationId: string, userId: string) {
    const run = await loadRun(runId, organizationId, userId);
    assertGitPreconditions(run);
    await ensureGitRepository(runId);

    const branch = buildAgentBranchName(run.id, run.task);
    const current = await runGit(runId, ["branch", "--show-current"]);
    const onProtected = PROTECTED_BRANCHES.has(current.stdout.trim().toLowerCase());
    if (onProtected) {
      await runGit(runId, ["checkout", NOVA_BASE_BRANCH]);
    }

    const res = await runGit(runId, ["checkout", "-b", branch]);
    if (res.exitCode !== 0) {
      run.gitWorkflowStatus = "failed";
      run.gitError = res.stderr || "Failed to create branch.";
      await run.save();
      throw new Error(run.gitError);
    }

    run.gitBranch = branch;
    run.gitWorkflowStatus = "branch_created";
    run.gitError = undefined;
    await run.save();

    return { branch, baseBranch: NOVA_BASE_BRANCH };
  },

  async gitStatus(runId: string, organizationId: string, userId: string) {
    await loadRun(runId, organizationId, userId);
    await ensureGitRepository(runId);
    const res = await runGit(runId, ["status", "--porcelain", "-b"]);
    return {
      porcelain: res.stdout.slice(0, AGENT_CONFIG.gitMaxOutputChars),
      exitCode: res.exitCode,
    };
  },

  async gitDiff(runId: string, organizationId: string, userId: string) {
    const run = await loadRun(runId, organizationId, userId);
    await ensureGitRepository(runId);
    const workspaceDiff = await collectWorkspaceDiff(runId);
    const unstaged = await runGit(runId, ["diff", "--no-color"]);
    const staged = await runGit(runId, ["diff", "--cached", "--no-color"]);
    return {
      summary: workspaceDiff,
      unstaged: unstaged.stdout.slice(0, AGENT_CONFIG.gitMaxOutputChars),
      staged: staged.stdout.slice(0, AGENT_CONFIG.gitMaxOutputChars),
    };
  },

  async createCommit(runId: string, organizationId: string, userId: string) {
    const run = await loadRun(runId, organizationId, userId);
    assertGitPreconditions(run);

    if (!run.gitBranch) {
      await this.createBranch(runId, organizationId, userId);
      const refreshed = await loadRun(runId, organizationId, userId);
      run.gitBranch = refreshed.gitBranch;
    }

    await ensureGitRepository(runId);
    const allowed = allowedPaths(run);
    const branchCheck = await runGit(runId, ["branch", "--show-current"]);
    const currentBranch = branchCheck.stdout.trim();
    if (PROTECTED_BRANCHES.has(currentBranch.toLowerCase()) || currentBranch === "main" || currentBranch === "master") {
      throw new Error("Cannot commit on protected branch.");
    }

    try {
      await runGit(runId, ["reset"]);
      const pathsToStage: string[] = [];
      for (const rel of allowed) {
        validateAgentFilePath(rel);
        await scanFileForSecrets(runId, rel);
        const abs = path.join(getWorkspaceDir(runId), rel);
        try {
          await fs.access(abs);
          pathsToStage.push(rel);
        } catch {
          pathsToStage.push(rel);
        }
      }

      if (pathsToStage.length === 0) {
        throw new Error("No valid agent files to stage.");
      }

      const addRes = await runGit(runId, ["add", "--", ...pathsToStage]);
      if (addRes.exitCode !== 0) {
        throw new Error(`git add failed: ${addRes.stderr}`);
      }

      const status = await runGit(runId, ["status", "--porcelain"]);
      const lines = status.stdout.split("\n").filter(Boolean);
      for (const line of lines) {
        const filePath = line.slice(3).trim();
        if (filePath.startsWith(".nova-")) continue;
        if (!allowed.has(filePath)) {
          await runGit(runId, ["reset", "HEAD", "--", filePath]);
          throw new Error(`Unrelated change detected: ${filePath}`);
        }
      }

      const message = generateCommitMessage(run.task, run.id);
      const commitRes = await runGit(runId, ["commit", "-m", message]);
      if (commitRes.exitCode !== 0) {
        throw new Error(`git commit failed: ${commitRes.stderr}`);
      }

      const shaRes = await runGit(runId, ["rev-parse", "HEAD"]);
      if (shaRes.exitCode !== 0) {
        throw new Error("Failed to read commit SHA.");
      }

      const sha = shaRes.stdout.trim();
      run.gitCommitSha = sha;
      run.gitWorkflowStatus = "committed";
      run.gitError = undefined;
      await run.save();

      return {
        branch: run.gitBranch,
        commitSha: sha,
        message,
        stagedFiles: pathsToStage,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Git commit failed.";
      await runGit(runId, ["reset", "--mixed", "HEAD"]).catch(() => {});
      run.gitWorkflowStatus = "failed";
      run.gitError = message;
      await run.save();
      throw err;
    }
  },
};
