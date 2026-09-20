import { IntegrationSettingsModel } from "../models/IntegrationSettings";
import { PullRequestModel } from "../models/PullRequest";
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

export const githubService = {
  async getGitHubConfig(organizationId: string) {
    const doc = await IntegrationSettingsModel.findOne({ organizationId });
    const clientId = isRealValue(doc?.github?.clientId)
      ? doc!.github!.clientId
      : (isRealValue(ENV.GITHUB_CLIENT_ID) ? ENV.GITHUB_CLIENT_ID : "");

    const clientSecret = doc?.github?.encryptedClientSecret
      ? decryptSecret(doc.github.encryptedClientSecret)
      : (isRealValue(ENV.GITHUB_CLIENT_SECRET) ? ENV.GITHUB_CLIENT_SECRET : "");

    const repository = isRealValue(doc?.github?.repository)
      ? doc!.github!.repository!
      : "";

    const enabled = doc?.github?.enabled ?? Boolean(clientId && repository);

    return {
      configured: Boolean(clientId && repository),
      enabled,
      clientId,
      clientSecret,
      repository,
    };
  },

  async syncPullRequestsFromGitHub(organizationId: string) {
    const config = await this.getGitHubConfig(organizationId);
    if (!config.repository || !config.repository.includes("/")) {
      return {
        success: false,
        synced: 0,
        message: "No GitHub repository configured for this organization.",
      };
    }

    const headers: Record<string, string> = {
      "User-Agent": "Nova-Workspace-App",
      "Accept": "application/vnd.github.v3+json",
    };

    if (config.clientId && config.clientSecret) {
      const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    try {
      const res = await fetch(
        `https://api.github.com/repos/${config.repository}/pulls?state=all&per_page=30`,
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

        const linkedIssueMatch = (ghPR.title + " " + (ghPR.body || "")).match(/\b(NV-\d+)\b/i);
        const linkedIssueKey = linkedIssueMatch ? linkedIssueMatch[1].toUpperCase() : undefined;

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
              branch: ghPR.head?.ref || "feature",
              targetBranch: ghPR.base?.ref || "main",
              status,
              commitsCount: ghPR.commits || 1,
              filesChangedCount: ghPR.changed_files || 1,
              additions: ghPR.additions || 0,
              deletions: ghPR.deletions || 0,
              createdAt: ghPR.created_at || new Date().toISOString(),
              updatedAt: ghPR.updated_at || new Date().toISOString(),
              linkedIssueKey,
              githubPrId: ghPR.id,
              githubUrl: ghPR.html_url,
              diff: [
                {
                  filename: `src/pr/${ghPR.number}/changes.ts`,
                  oldPath: `a/${ghPR.base?.ref || "main"}`,
                  newPath: `b/${ghPR.head?.ref || "feature"}`,
                  chunks: [
                    {
                      header: `@@ -1,5 +1,10 @@ ${ghPR.title}`,
                      lines: [
                        { type: "normal", oldLine: 1, newLine: 1, content: `// Linked to GitHub PR #${ghPR.number}` },
                        { type: "add", newLine: 2, content: `+ // Branch: ${ghPR.head?.ref} -> ${ghPR.base?.ref}` },
                        { type: "add", newLine: 3, content: `+ // State: ${ghPR.state.toUpperCase()}` },
                        { type: "normal", oldLine: 2, newLine: 4, content: `// Author: ${authorName}` },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          { upsert: true, new: true }
        );
        syncedCount++;
      }

      return {
        success: true,
        synced: syncedCount,
        repository: config.repository,
        message: `Successfully synchronized ${syncedCount} pull requests from ${config.repository}.`,
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
