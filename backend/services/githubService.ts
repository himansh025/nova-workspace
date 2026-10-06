import { IntegrationSettingsModel } from "../models/IntegrationSettings";
import { PullRequestModel, IPullRequestDiffFile } from "../models/PullRequest";
import { OrganizationModel } from "../models/Organization";
import { RepositoryModel } from "../models/Repository";
import { githubAppService } from "./githubAppService";
import { decryptSecret } from "./cryptoService";
import { ENV } from "../config/env";

function isRealValue(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.startsWith("xxxx") || trimmed.includes("xxxx")) return false;
  if (trimmed === "organization/repo") return false;
  return true;
}

export function extractTaskKey(
  branch?: string,
  title?: string,
  body?: string,
  commitMessage?: string
): string | undefined {
  const sources = [branch, title, body, commitMessage];
  for (const src of sources) {
    if (!src) continue;
    const match = src.match(/\b(NV-\d+)\b/i);
    if (match) return match[1].toUpperCase();
  }
  return undefined;
}

export function generateRealisticDiffForTopic(title: string = "", taskKey?: string): IPullRequestDiffFile[] {
  const lower = (title + " " + (taskKey || "")).toLowerCase();

  if (lower.includes("security") || lower.includes("header") || taskKey === "NV-851") {
    return [
      {
        filename: "src/middleware/edgeHeaders.ts",
        oldPath: "a/src/middleware/edgeHeaders.ts",
        newPath: "b/src/middleware/edgeHeaders.ts",
        chunks: [
          {
            header: "@@ -12,6 +12,18 @@ export function injectEdgeSecurityHeaders(res: Response) {",
            lines: [
              { type: "normal", oldLine: 12, newLine: 12, content: "  // Set standard edge proxy headers" },
              { type: "normal", oldLine: 13, newLine: 13, content: "  res.setHeader('X-Powered-By', 'Nova Edge Engine');" },
              { type: "del", oldLine: 14, content: "-  res.setHeader('X-Frame-Options', 'SAMEORIGIN');" },
              { type: "add", newLine: 14, content: "+  res.setHeader('X-Frame-Options', 'DENY');" },
              { type: "add", newLine: 15, content: "+  res.setHeader('X-Content-Type-Options', 'nosniff');" },
              { type: "add", newLine: 16, content: "+  res.setHeader('X-XSS-Protection', '1; mode=block');" },
              { type: "add", newLine: 17, content: "+  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');" },
              { type: "add", newLine: 18, content: "+  res.setHeader('Content-Security-Policy', \"default-src 'self'; script-src 'self' 'nonce-rAnd0m123'\");" },
              { type: "normal", oldLine: 15, newLine: 19, content: "  return res;" },
            ],
          },
        ],
      },
      {
        filename: "src/config/security.ts",
        oldPath: "a/src/config/security.ts",
        newPath: "b/src/config/security.ts",
        chunks: [
          {
            header: "@@ -4,4 +4,10 @@ export const securityConfig = {",
            lines: [
              { type: "normal", oldLine: 4, newLine: 4, content: "  enableHelmet: true," },
              { type: "add", newLine: 5, content: "+  hstsMaxAge: 31536000," },
              { type: "add", newLine: 6, content: "+  enforceTenantIsolation: true," },
              { type: "normal", oldLine: 5, newLine: 7, content: "};" },
            ],
          },
        ],
      },
    ];
  }

  if (lower.includes("auth") || lower.includes("token") || taskKey === "NV-873") {
    return [
      {
        filename: "src/server/auth/verifier.ts",
        oldPath: "a/src/server/auth/verifier.ts",
        newPath: "b/src/server/auth/verifier.ts",
        chunks: [
          {
            header: "@@ -34,5 +34,12 @@ export async function verifyAuthToken(token: string) {",
            lines: [
              { type: "normal", oldLine: 34, newLine: 34, content: "  const decoded = await verifySignature(token);" },
              { type: "del", oldLine: 35, content: "-  return { user: decoded.sub, valid: true };" },
              { type: "add", newLine: 35, content: "+  if (!decoded.tenantId || typeof decoded.tenantId !== 'string') {" },
              { type: "add", newLine: 36, content: "+    throw new SecurityException('Missing mandatory tenant claim in token');" },
              { type: "add", newLine: 37, content: "+  }" },
              { type: "add", newLine: 38, content: "+  return { user: decoded.sub, tenantId: decoded.tenantId, valid: true };" },
            ],
          },
        ],
      },
    ];
  }

  return [
    {
      filename: "src/core/service.ts",
      oldPath: "a/src/core/service.ts",
      newPath: "b/src/core/service.ts",
      chunks: [
        {
          header: `@@ -1,5 +1,10 @@ // Implementation for ${taskKey || "PR"}`,
          lines: [
            { type: "normal", oldLine: 1, newLine: 1, content: `// Service handler for ${title}` },
            { type: "add", newLine: 2, content: "+ export async function handleRequest(ctx: Context) {" },
            { type: "add", newLine: 3, content: "+   console.log('Processing request context for tenant:', ctx.tenantId);" },
            { type: "add", newLine: 4, content: "+   return { success: true, timestamp: Date.now() };" },
            { type: "add", newLine: 5, content: "+ }" },
          ],
        },
      ],
    },
  ];
}

export function parsePatchToDiffFiles(filename: string, patch?: string): IPullRequestDiffFile[] {
  if (!patch) {
    return [
      {
        filename,
        oldPath: `a/${filename}`,
        newPath: `b/${filename}`,
        chunks: [{ header: "@@ -1,1 +1,1 @@", lines: [{ type: "normal", oldLine: 1, newLine: 1, content: "// File modified" }] }],
      },
    ];
  }

  const lines = patch.split("\n");
  const chunks: any[] = [];
  let currentChunk: any = null;
  let oldLine = 1;
  let newLine = 1;

  for (const line of lines) {
    if (line.startsWith("@@")) {
      currentChunk = { header: line, lines: [] };
      chunks.push(currentChunk);
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      continue;
    }

    if (!currentChunk) {
      currentChunk = { header: "@@ -1,1 +1,1 @@", lines: [] };
      chunks.push(currentChunk);
    }

    if (line.startsWith("+")) {
      currentChunk.lines.push({ type: "add", newLine: newLine++, content: line });
    } else if (line.startsWith("-")) {
      currentChunk.lines.push({ type: "del", oldLine: oldLine++, content: line });
    } else {
      currentChunk.lines.push({ type: "normal", oldLine: oldLine++, newLine: newLine++, content: line });
    }
  }

  return [
    {
      filename,
      oldPath: `a/${filename}`,
      newPath: `b/${filename}`,
      chunks: chunks.length > 0 ? chunks : [{ header: "@@ -1,1 +1,1 @@", lines: [] }],
    },
  ];
}

export const githubService = {
  async getGitHubAuth(organizationId: string): Promise<{
    provider: "github_app" | "legacy_pat" | "none";
    token?: string;
    repository?: string;
    webhookSecret?: string;
    installationId?: number;
    defaultBranch?: string;
  }> {
    // 1. Prioritize GitHub App installation
    const installation = await githubAppService.getActiveInstallation(organizationId);
    if (installation) {
      const selectedRepo = await RepositoryModel.findOne({ organizationId, selected: true });
      let token: string | undefined;
      try {
        token = await githubAppService.createInstallationToken(installation.githubInstallationId);
      } catch (err: any) {
        console.warn("[githubService] Failed to generate installation token:", err.message);
      }

      return {
        provider: "github_app",
        token,
        repository: selectedRepo?.fullName,
        defaultBranch: selectedRepo?.defaultBranch || "main",
        webhookSecret: ENV.GITHUB_WEBHOOK_SECRET,
        installationId: installation.githubInstallationId,
      };
    }

    // 2. Fall back to Legacy PAT configuration if present
    const doc = await IntegrationSettingsModel.findOne({ organizationId });
    if (doc?.github?.enabled) {
      const clientSecret = doc.github.encryptedClientSecret
        ? decryptSecret(doc.github.encryptedClientSecret)
        : isRealValue(ENV.GITHUB_CLIENT_SECRET)
        ? ENV.GITHUB_CLIENT_SECRET
        : "";

      const webhookSecret = doc.github.encryptedWebhookSecret
        ? decryptSecret(doc.github.encryptedWebhookSecret)
        : ENV.GITHUB_WEBHOOK_SECRET || "";

      const repository = isRealValue(doc.github.repository) ? doc.github.repository : "";

      if (repository) {
        return {
          provider: "legacy_pat",
          token: clientSecret,
          repository,
          webhookSecret,
        };
      }
    }

    return { provider: "none" };
  },

  async getGitHubConfig(organizationId: string) {
    const auth = await this.getGitHubAuth(organizationId);
    if (auth.provider === "github_app") {
      return {
        configured: Boolean(auth.repository),
        enabled: true,
        provider: "github_app",
        repository: auth.repository || "",
        webhookSecret: auth.webhookSecret || "",
      };
    }

    if (auth.provider === "legacy_pat") {
      return {
        configured: Boolean(auth.repository),
        enabled: true,
        provider: "legacy_pat",
        repository: auth.repository || "",
        webhookSecret: auth.webhookSecret || "",
      };
    }

    return {
      configured: false,
      enabled: false,
      provider: "none",
      repository: "",
      webhookSecret: ENV.GITHUB_WEBHOOK_SECRET || "",
    };
  },

  async fetchPullRequestDiff(
    organizationId: string,
    prNumber: number,
    fallbackTitle: string,
    fallbackTaskKey?: string,
    isSimulation = false
  ): Promise<IPullRequestDiffFile[]> {
    const auth = await this.getGitHubAuth(organizationId);

    if (auth.provider === "none" || !auth.repository) {
      if (isSimulation || !ENV.IS_PRODUCTION) {
        return generateRealisticDiffForTopic(fallbackTitle, fallbackTaskKey);
      }
      return [];
    }

    const headers: Record<string, string> = {
      "User-Agent": "Nova-Workspace-App",
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (auth.token && auth.token.trim().length > 0) {
      const secret = auth.token.trim();
      if (
        auth.provider === "github_app" ||
        secret.startsWith("ghp_") ||
        secret.startsWith("github_pat_") ||
        secret.startsWith("gho_") ||
        secret.startsWith("ghu_") ||
        secret.length > 25
      ) {
        headers["Authorization"] = `Bearer ${secret}`;
      }
    }

    try {
      const filesRes = await fetch(
        `https://api.github.com/repos/${auth.repository}/pulls/${prNumber}/files`,
        { headers }
      );
      if (filesRes.ok) {
        const filesData: any = await filesRes.json();
        if (Array.isArray(filesData)) {
          return filesData.flatMap((f: any) => parsePatchToDiffFiles(f.filename, f.patch));
        }
      }
    } catch (e: any) {
      console.warn("[fetchPullRequestDiff] GitHub API fetch error:", e.message);
    }

    // In production, do NOT silently replace real repository changes with fake diffs!
    if (isSimulation) {
      return generateRealisticDiffForTopic(fallbackTitle, fallbackTaskKey);
    }

    return [];
  },

  async syncPullRequestsFromGitHub(organizationId: string) {
    const auth = await this.getGitHubAuth(organizationId);
    if (!auth.repository || !auth.repository.includes("/")) {
      return {
        success: false,
        synced: 0,
        message: "No GitHub repository configured for this organization.",
      };
    }

    const headers: Record<string, string> = {
      "User-Agent": "Nova-Workspace-App",
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (auth.token && auth.token.trim().length > 0) {
      const secret = auth.token.trim();
      if (
        auth.provider === "github_app" ||
        secret.startsWith("ghp_") ||
        secret.startsWith("github_pat_") ||
        secret.startsWith("gho_") ||
        secret.startsWith("ghu_") ||
        secret.length > 25
      ) {
        headers["Authorization"] = `Bearer ${secret}`;
      }
    }

    try {
      // Sync repository default branch into Organization model if available
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${auth.repository}`, { headers });
        if (repoRes.ok) {
          const repoMeta: any = await repoRes.json();
          if (repoMeta.default_branch) {
            await OrganizationModel.updateOne(
              { id: organizationId },
              { $set: { defaultBranch: repoMeta.default_branch } }
            );
          }
        }
      } catch {}

      const res = await fetch(
        `https://api.github.com/repos/${auth.repository}/pulls?state=all&per_page=30`,
        { headers }
      );

      if (!res.ok) {
        const errorText = await res.text();
        return {
          success: false,
          synced: 0,
          status: res.status,
          message: `GitHub API error (${res.status}): ${errorText.slice(0, 150)}`,
        };
      }

      const ghPRs = (await res.json()) as any[];
      let syncedCount = 0;

      for (const ghPR of ghPRs) {
        const prId = `pr-gh-${ghPR.id}`;
        const authorName = ghPR.user?.login || "GitHub User";
        const authorInitials = authorName.slice(0, 2).toUpperCase();

        const status = ghPR.merged_at
          ? "merged"
          : ghPR.state === "closed"
          ? "closed"
          : ghPR.draft
          ? "draft"
          : "open";

        const headBranch = ghPR.head?.ref || "feature";
        const targetBranch = ghPR.base?.ref || "main";
        const linkedIssueKey = extractTaskKey(headBranch, ghPR.title, ghPR.body);

        const diffFiles = await this.fetchPullRequestDiff(
          organizationId,
          ghPR.number,
          ghPR.title,
          linkedIssueKey
        );

        await PullRequestModel.findOneAndUpdate(
          { organizationId, $or: [{ id: prId }, { number: ghPR.number }] },
          {
            $set: {
              id: prId,
              organizationId,
              number: ghPR.number,
              title: ghPR.title,
              description: ghPR.body || "Imported live from GitHub repository.",
              author: {
                name: authorName,
                avatar: ghPR.user?.avatar_url || "",
                initials: authorInitials,
              },
              branch: headBranch,
              targetBranch,
              status,
              commitsCount: ghPR.commits || 1,
              filesChangedCount: ghPR.changed_files || diffFiles.length,
              additions: ghPR.additions || 0,
              deletions: ghPR.deletions || 0,
              createdAt: ghPR.created_at || new Date().toISOString(),
              updatedAt: ghPR.updated_at || new Date().toISOString(),
              linkedIssueKey,
              githubPrId: ghPR.id,
              githubUrl: ghPR.html_url,
              diff: diffFiles,
            },
          },
          { upsert: true, new: true }
        );
        syncedCount++;
      }

      return {
        success: true,
        synced: syncedCount,
        repository: auth.repository,
        message: `Successfully synchronized ${syncedCount} pull requests from ${auth.repository}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        synced: 0,
        message: `Network error connecting to GitHub: ${err.message}`,
      };
    }
  },
};
