import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ENV } from "../config/env";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { RepositoryModel } from "../models/Repository";
import { GitHubAccountModel } from "../models/GitHubAccount";
import { OrganizationModel } from "../models/Organization";

function appPrivateKey(): string {
  return ENV.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n");
}

function safeGitHubError(status: number, fallback: string): string {
  if (status === 401) return "GitHub authentication failed.";
  if (status === 403) return "GitHub denied access or rate limit was reached.";
  if (status === 404) return "GitHub resource was not found or is no longer accessible.";
  if (status === 409) return "GitHub resource is temporarily unavailable.";
  if (status === 422) return "GitHub rejected the request.";
  if (status === 429) return "GitHub rate limit was reached.";
  if (status >= 500) return "GitHub is temporarily unavailable.";
  return fallback;
}

export function isGitHubAppConfigured(): boolean {
  return Boolean(ENV.GITHUB_APP_ID && ENV.GITHUB_PRIVATE_KEY && ENV.GITHUB_APP_URL);
}

export function createGitHubInstallState(userId: string, organizationId: string): string {
  const payload = {
    userId,
    organizationId,
    exp: Math.floor(Date.now() / 1000) + 10 * 60, // 10 minute expiry
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  return jwt.sign(payload, ENV.SESSION_SECRET);
}

export function verifyGitHubInstallState(state: string, userId: string, organizationId: string): any {
  try {
    const decoded = jwt.verify(state, ENV.SESSION_SECRET) as any;
    if (decoded.userId !== userId || decoded.organizationId !== organizationId) {
      throw new Error("State parameter does not match the active authenticated session.");
    }
    return decoded;
  } catch (err: any) {
    throw new Error(`Invalid or expired GitHub installation state: ${err.message}`);
  }
}

export function createAppJwt(): string {
  if (!ENV.GITHUB_APP_ID || !ENV.GITHUB_PRIVATE_KEY) {
    throw new Error("GitHub App credentials (GITHUB_APP_ID / GITHUB_PRIVATE_KEY) are not configured.");
  }
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: ENV.GITHUB_APP_ID,
    },
    appPrivateKey(),
    { algorithm: "RS256" }
  );
}

export const githubAppService = {
  isConfigured(): boolean {
    return isGitHubAppConfigured();
  },

  getInstallUrl(userId: string, organizationId: string): string {
    const state = createGitHubInstallState(userId, organizationId);
    const baseAppUrl = ENV.GITHUB_APP_URL.replace(/\/+$/, "");
    return `${baseAppUrl}/installations/new?state=${encodeURIComponent(state)}`;
  },

  async createInstallationToken(githubInstallationId: number): Promise<string> {
    const appToken = createAppJwt();
    const res = await fetch(`https://api.github.com/app/installations/${githubInstallationId}/access_tokens`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appToken}`,
        "User-Agent": "Nova-Workspace-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      throw new Error(safeGitHubError(res.status, "Unable to create GitHub installation token."));
    }

    const data: any = await res.json();
    return data.token as string;
  },

  async getInstallationFromGitHub(githubInstallationId: number): Promise<any> {
    const appToken = createAppJwt();
    const res = await fetch(`https://api.github.com/app/installations/${githubInstallationId}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appToken}`,
        "User-Agent": "Nova-Workspace-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      throw new Error(safeGitHubError(res.status, "Unable to read GitHub installation."));
    }
    return res.json();
  },

  async upsertInstallation(input: {
    organizationId: string;
    userId: string;
    githubInstallationId: number;
  }) {
    const installation = await this.getInstallationFromGitHub(input.githubInstallationId);
    const account = installation.account || {};
    let githubAccountId: string | undefined;

    if (account.id && account.login) {
      const accountDoc = await GitHubAccountModel.findOneAndUpdate(
        { userId: input.userId, githubUserId: account.id },
        {
          $set: {
            id: `gha-${input.userId}-${account.id}`,
            userId: input.userId,
            githubUserId: account.id,
            login: account.login,
            avatarUrl: account.avatar_url || "",
          },
        },
        { upsert: true, new: true }
      );
      githubAccountId = accountDoc.id;
    }

    const id = `ghi-${input.githubInstallationId}`;
    const installationDoc = await GitHubInstallationModel.findOneAndUpdate(
      { githubInstallationId: input.githubInstallationId },
      {
        $setOnInsert: { id },
        $set: {
          organizationId: input.organizationId,
          githubAccountId,
          accountLogin: account.login || "",
          accountType: account.type || "",
          status: "ACTIVE",
          permissions: installation.permissions || {},
        },
      },
      { upsert: true, new: true }
    );

    // Initial sync of repositories for this installation
    try {
      await this.syncRepositoriesFromGitHub(input.organizationId, input.githubInstallationId);
    } catch (syncErr: any) {
      console.warn("[githubAppService] Initial repo sync warning:", syncErr.message);
    }

    return installationDoc;
  },

  async getActiveInstallation(organizationId: string) {
    return GitHubInstallationModel.findOne({ organizationId, status: "ACTIVE" });
  },

  async syncRepositoriesFromGitHub(organizationId: string, githubInstallationId: number) {
    const token = await this.createInstallationToken(githubInstallationId);
    const res = await fetch(`https://api.github.com/installation/repositories?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Nova-Workspace-App",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      throw new Error(safeGitHubError(res.status, "Unable to fetch repositories from GitHub."));
    }

    const data: any = await res.json();
    const repos = data.repositories || [];

    for (const repo of repos) {
      await RepositoryModel.findOneAndUpdate(
        {
          organizationId,
          githubInstallationId,
          githubRepositoryId: repo.id,
        },
        {
          $set: {
            id: `repo-${repo.id}`,
            organizationId,
            githubInstallationId,
            githubRepositoryId: repo.id,
            owner: repo.owner?.login || repo.full_name?.split("/")[0] || "",
            name: repo.name,
            fullName: repo.full_name,
            private: Boolean(repo.private),
            defaultBranch: repo.default_branch || "main",
            htmlUrl: repo.html_url || "",
            archived: Boolean(repo.archived),
          },
        },
        { upsert: true, new: true }
      );
    }
  },

  async listRepositories(organizationId: string, page = 1, perPage = 30) {
    const installation = await this.getActiveInstallation(organizationId);
    if (!installation) {
      return {
        repositories: [],
        totalCount: 0,
        page,
        perPage,
        installationActive: false,
      };
    }

    const token = await this.createInstallationToken(installation.githubInstallationId);
    const res = await fetch(
      `https://api.github.com/installation/repositories?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Nova-Workspace-App",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404 || res.status === 401) {
        installation.status = "REVOKED";
        await installation.save();
      }
      throw new Error(safeGitHubError(res.status, "Unable to list GitHub repositories."));
    }

    const data: any = await res.json();
    const rawRepos = data.repositories || [];

    const selectedRepo = await RepositoryModel.findOne({ organizationId, selected: true });

    const repositories = rawRepos.map((repo: any) => ({
      id: `repo-${repo.id}`,
      githubRepositoryId: repo.id,
      owner: repo.owner?.login || repo.full_name?.split("/")[0] || "",
      name: repo.name,
      fullName: repo.full_name,
      private: Boolean(repo.private),
      defaultBranch: repo.default_branch || "main",
      htmlUrl: repo.html_url || "",
      archived: Boolean(repo.archived),
      selected: selectedRepo ? selectedRepo.githubRepositoryId === repo.id : false,
      selectedBranch: selectedRepo && selectedRepo.githubRepositoryId === repo.id ? selectedRepo.selectedBranch : undefined,
    }));

    return {
      repositories,
      totalCount: data.total_count || repositories.length,
      page,
      perPage,
      installationActive: true,
    };
  },

  async selectRepository(organizationId: string, githubRepositoryId: number, selectedBranch?: string) {
    const installation = await this.getActiveInstallation(organizationId);
    if (!installation) throw new Error("No active GitHub App installation found for this organization.");

    const listed = await this.listRepositories(organizationId, 1, 100);
    const repo = listed.repositories.find((r: any) => r.githubRepositoryId === githubRepositoryId);
    if (!repo) throw new Error("Repository is not accessible by this GitHub installation.");

    await RepositoryModel.updateMany({ organizationId }, { $set: { selected: false } });

    const updated = await RepositoryModel.findOneAndUpdate(
      { organizationId, githubInstallationId: installation.githubInstallationId, githubRepositoryId },
      {
        $set: {
          id: `repo-${githubRepositoryId}`,
          organizationId,
          githubInstallationId: installation.githubInstallationId,
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          private: repo.private,
          defaultBranch: repo.defaultBranch,
          htmlUrl: repo.htmlUrl,
          archived: repo.archived,
          selectedBranch: selectedBranch || repo.defaultBranch,
          selected: true,
        },
      },
      { upsert: true, new: true }
    );

    // Sync selected repo and branch to Organization model
    await OrganizationModel.updateOne(
      { id: organizationId },
      { $set: { defaultBranch: selectedBranch || repo.defaultBranch } }
    );

    return updated;
  },

  async getSelectedRepository(organizationId: string) {
    return RepositoryModel.findOne({ organizationId, selected: true });
  },

  async listBranches(organizationId: string, repositoryId: string, page = 1, perPage = 100) {
    const repository = await RepositoryModel.findOne({ organizationId, id: repositoryId });
    if (!repository) throw new Error("Repository not found for this organization.");

    const installation = await GitHubInstallationModel.findOne({
      organizationId,
      githubInstallationId: repository.githubInstallationId,
      status: "ACTIVE",
    });
    if (!installation) throw new Error("GitHub installation is not active.");

    const token = await this.createInstallationToken(installation.githubInstallationId);
    const res = await fetch(
      `https://api.github.com/repos/${repository.fullName}/branches?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Nova-Workspace-App",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    if (!res.ok) throw new Error(safeGitHubError(res.status, "Unable to list GitHub branches."));
    const data = ((await res.json()) as any[]) || [];
    return {
      branches: data.map((b) => ({ name: b.name, protected: Boolean(b.protected) })),
      page,
      perPage,
    };
  },

  async selectBranch(organizationId: string, repositoryId: string, branch: string) {
    const repository = await RepositoryModel.findOne({ organizationId, id: repositoryId });
    if (!repository) throw new Error("Repository not found for this organization.");
    repository.selectedBranch = branch;
    await repository.save();

    await OrganizationModel.updateOne({ id: organizationId }, { $set: { defaultBranch: branch } });
    return repository;
  },

  async disconnect(organizationId: string) {
    await GitHubInstallationModel.updateMany({ organizationId }, { $set: { status: "REVOKED" } });
    await RepositoryModel.updateMany({ organizationId }, { $set: { selected: false } });
    return { success: true, message: "GitHub App disconnected successfully." };
  },

  async getStatus(organizationId: string) {
    const installation = await GitHubInstallationModel.findOne({ organizationId, status: "ACTIVE" });
    const selectedRepo = await RepositoryModel.findOne({ organizationId, selected: true });

    return {
      appConfigured: isGitHubAppConfigured(),
      connected: Boolean(installation),
      installation: installation
        ? {
            id: installation.id,
            githubInstallationId: installation.githubInstallationId,
            accountLogin: installation.accountLogin,
            accountType: installation.accountType,
            status: installation.status,
            permissions: installation.permissions,
            createdAt: installation.createdAt,
          }
        : null,
      selectedRepository: selectedRepo
        ? {
            id: selectedRepo.id,
            githubRepositoryId: selectedRepo.githubRepositoryId,
            fullName: selectedRepo.fullName,
            owner: selectedRepo.owner,
            name: selectedRepo.name,
            private: selectedRepo.private,
            defaultBranch: selectedRepo.defaultBranch,
            selectedBranch: selectedRepo.selectedBranch || selectedRepo.defaultBranch,
            htmlUrl: selectedRepo.htmlUrl,
          }
        : null,
    };
  },
};
