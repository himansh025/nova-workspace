import { AgentRunModel, IAgentRunDocument } from "../../../models/AgentRun";
import { githubRepositoryExplorerService } from "../../githubRepositoryExplorerService";
import { githubAppService } from "../../githubAppService";
import { AGENT_CONFIG } from "./agentConfig";
import { runGit, sanitizeBranchName } from "./gitWorkflowService";
import { collectWorkspaceDiff } from "./agentWorkspaceService";

const PROTECTED = new Set(["main", "master"]);

export type PublishStatus = "idle" | "pushed" | "pr_created" | "failed";

export interface IGitHubApiClient {
  fetch(url: string, init?: RequestInit): Promise<Response>;
}

const defaultApiClient: IGitHubApiClient = {
  fetch: (url, init) => fetch(url, init),
};

let apiClientOverride: IGitHubApiClient | null = null;
let pushExecutorOverride:
  | ((runId: string, args: string[]) => ReturnType<typeof runGit>)
  | null = null;

let verifyRepositoryOverride:
  | ((
      organizationId: string,
      repositoryId: string
    ) => Promise<{ repository: any; token?: string }>)
  | null = null;

export function __setGithubApiClientForTests(client: IGitHubApiClient | null): void {
  apiClientOverride = client;
}

export function __setPushExecutorForTests(
  fn: ((runId: string, args: string[]) => ReturnType<typeof runGit>) | null
): void {
  pushExecutorOverride = fn;
}

export function __setVerifyRepositoryForTests(
  fn:
    | ((
        organizationId: string,
        repositoryId: string
      ) => Promise<{ repository: any; token?: string }>)
    | null
): void {
  verifyRepositoryOverride = fn;
}

async function verifyRepository(organizationId: string, repositoryId: string) {
  if (verifyRepositoryOverride) {
    return verifyRepositoryOverride(organizationId, repositoryId);
  }
  return githubRepositoryExplorerService.verifyAndGetRepository(organizationId, repositoryId);
}

function api(): IGitHubApiClient {
  return apiClientOverride || defaultApiClient;
}

async function execPush(runId: string, args: string[]) {
  return pushExecutorOverride ? pushExecutorOverride(runId, args) : runGit(runId, args);
}

function redactToken(text: string): string {
  return text.replace(/x-access-token:[^@\s]+@/g, "x-access-token:[REDACTED]@");
}

async function loadRun(runId: string, organizationId: string, userId: string) {
  const run = await AgentRunModel.findOne({ id: runId, organizationId, userId });
  if (!run) throw new Error("Agent run not found.");
  return run;
}

export function assertPublishPreconditions(run: IAgentRunDocument): void {
  if (!run.enableGitWorkflow) {
    throw new Error("Git workflow is not enabled for this run.");
  }
  if (run.enableVerification && run.verificationStatus !== "passed") {
    throw new Error("Publish requires verification to pass.");
  }
  if (run.gitWorkflowStatus !== "committed" || !run.gitCommitSha || !run.gitBranch) {
    throw new Error("Publish requires a local agent commit on an agent branch.");
  }
  sanitizeBranchName(run.gitBranch);
}

export function buildPullRequestBody(run: IAgentRunDocument, diffSummary: string): string {
  const tests =
    run.lastExecution?.success === true
      ? `✅ Passed (\`${run.lastExecution.tool}\`, exit ${run.lastExecution.exitCode})`
      : run.verificationStatus === "passed"
        ? "✅ Passed (verified)"
        : "⚠️ Not verified / not executed";

  const files = (run.modifiedFiles || []).map((f) => `- \`${f}\``).join("\n") || "- (none listed)";

  return `## Summary
${run.task.trim().split("\n")[0]}

## Agent run
- **Run ID:** \`${run.id}\`
- **Commit:** \`${run.gitCommitSha}\`
- **Branch:** \`${run.gitBranch}\`

## Files changed
${files}

## Diff summary
\`\`\`json
${diffSummary}
\`\`\`

## Tests executed
${tests}

## Limitations
- Automated agent changes — human review required.
- Sandbox may differ from CI/production.
- No guarantee of completeness; verify edge cases manually.`;
}

export const agentGithubPublishService = {
  async pushBranch(runId: string, organizationId: string, userId: string) {
    const run = await loadRun(runId, organizationId, userId);
    assertPublishPreconditions(run);

    const branch = run.gitBranch!;
    if (PROTECTED.has(branch.toLowerCase()) || PROTECTED.has(branch.split("/").pop()!.toLowerCase())) {
      throw new Error("Cannot push to protected branch.");
    }

    if (
      run.publishStatus === "pushed" &&
      run.githubPushSha === run.gitCommitSha &&
      run.gitBranch === branch
    ) {
      return {
        idempotent: true,
        branch,
        commitSha: run.gitCommitSha,
        publishStatus: run.publishStatus,
      };
    }

    const { repository, token } = await verifyRepository(organizationId, run.repositoryId);

    if (!githubAppService.isConfigured() || !token) {
      run.publishStatus = "failed";
      run.publishError = "GitHub App is not configured or installation token unavailable.";
      await run.save();
      throw new Error(run.publishError);
    }

    const pushUrl = `https://x-access-token:${token}@github.com/${repository.fullName}.git`;
    const ref = `refs/heads/${branch}`;

    try {
      const res = await execPush(runId, ["push", pushUrl, `HEAD:${ref}`]);
      if (res.exitCode !== 0) {
        const err = redactToken(res.stderr || res.stdout || "git push failed");
        if (/permission|403|denied/i.test(err)) {
          throw new Error("GitHub permission denied for push. Ensure the app has contents: write.");
        }
        if (/rejected|non-fast-forward|conflict/i.test(err)) {
          throw new Error(`Branch push conflict: ${err.slice(0, 500)}`);
        }
        throw new Error(`Push failed: ${err.slice(0, 500)}`);
      }

      run.publishStatus = "pushed";
      run.githubPushSha = run.gitCommitSha;
      run.publishError = undefined;
      await run.save();

      return {
        idempotent: false,
        branch,
        commitSha: run.gitCommitSha,
        repository: repository.fullName,
        publishStatus: run.publishStatus,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Push failed.";
      run.publishStatus = "failed";
      run.publishError = message;
      await run.save();
      throw err;
    }
  },

  async findExistingPullRequest(
    token: string,
    owner: string,
    repo: string,
    branch: string
  ): Promise<{ number: number; html_url: string; id: number } | null> {
    const head = `${owner}:${branch}`;
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&head=${encodeURIComponent(head)}`;
    const res = await api().fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Nova-Workspace-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return null;
    const data: any[] = await res.json();
    const pr = data[0];
    if (!pr) return null;
    return { number: pr.number, html_url: pr.html_url, id: pr.id };
  },

  async createPullRequest(runId: string, organizationId: string, userId: string) {
    const run = await loadRun(runId, organizationId, userId);
    assertPublishPreconditions(run);

    if (run.pullRequestNumber && run.pullRequestUrl) {
      return {
        idempotent: true,
        number: run.pullRequestNumber,
        url: run.pullRequestUrl,
        publishStatus: run.publishStatus,
      };
    }

    if (run.publishStatus !== "pushed" || run.githubPushSha !== run.gitCommitSha) {
      await this.pushBranch(runId, organizationId, userId);
      const refreshed = await loadRun(runId, organizationId, userId);
      run.publishStatus = refreshed.publishStatus;
      run.githubPushSha = refreshed.githubPushSha;
    }

    const { repository, token } = await verifyRepository(organizationId, run.repositoryId);

    if (!token) {
      throw new Error("GitHub installation token unavailable.");
    }

    const branch = run.gitBranch!;
    const base = repository.defaultBranch || "main";
    if (PROTECTED.has(base.toLowerCase()) && branch === base) {
      throw new Error("Invalid PR base/head configuration.");
    }

    const existing = await this.findExistingPullRequest(
      token,
      repository.owner,
      repository.name,
      branch
    );
    if (existing) {
      run.pullRequestNumber = existing.number;
      run.pullRequestUrl = existing.html_url;
      run.publishStatus = "pr_created";
      await run.save();
      return {
        idempotent: true,
        number: existing.number,
        url: existing.html_url,
        publishStatus: "pr_created",
      };
    }

    let diffJson = JSON.stringify(run.diffSummary || {});
    try {
      const diff = await collectWorkspaceDiff(runId);
      diffJson = JSON.stringify(diff);
    } catch {
      // workspace may be unavailable in some environments; fall back to persisted summary
    }
    const title = `feat(agent): ${run.task.trim().split("\n")[0].slice(0, 72)}`;
    const body = buildPullRequestBody(run, diffJson);

    const url = `https://api.github.com/repos/${repository.fullName}/pulls`;
    const res = await api().fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "Nova-Workspace-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title,
        head: branch,
        base,
        body,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const safe = redactToken(errText).slice(0, 500);
      if (res.status === 403) {
        throw new Error("GitHub permission denied for pull request creation.");
      }
      if (res.status === 422) {
        throw new Error(`GitHub rejected PR creation: ${safe}`);
      }
      throw new Error(`GitHub API failure (${res.status}): ${safe}`);
    }

    const pr: any = await res.json();
    run.pullRequestNumber = pr.number;
    run.pullRequestUrl = pr.html_url;
    run.publishStatus = "pr_created";
    run.publishError = undefined;
    await run.save();

    return {
      idempotent: false,
      number: pr.number,
      url: pr.html_url,
      title: pr.title,
      publishStatus: "pr_created",
    };
  },
};
