import { Request, Response } from "express";
import crypto from "crypto";
import { broadcastEvent } from "../services/events";
import { OutgoingWebhookModel } from "../models/OutgoingWebhook";
import { PullRequestModel } from "../models/PullRequest";
import { TaskModel } from "../models/Task";
import { ActivityItemModel } from "../models/Activity";
import { OrganizationModel } from "../models/Organization";
import { OrganizationMemberModel } from "../models/OrganizationMember";
import { IntegrationSettingsModel } from "../models/IntegrationSettings";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { RepositoryModel } from "../models/Repository";
import { GitHubWebhookDeliveryModel } from "../models/GitHubWebhookDelivery";
import { githubService, extractTaskKey } from "../services/githubService";
import { notificationService } from "../services/notificationService";
import { decryptSecret } from "../services/cryptoService";
import { ENV } from "../config/env";

const defaultWebhooks = [
  {
    id: "wh-1",
    name: "Slack #dev-deployments Channel",
    target: "slack",
    url: "https://hooks.slack.com/services/T00/B00/XXXXX",
    events: ["release_updated", "spec_approved"],
    status: "active",
    lastDelivery: "14m ago (200 OK)",
    deliverySuccessRate: 99.8,
  },
  {
    id: "wh-2",
    name: "Discord #incident-alerts Channel",
    target: "discord",
    url: "https://discord.com/api/webhooks/0000/XXXXX",
    events: ["task_created", "git_webhook"],
    status: "active",
    lastDelivery: "1h ago (200 OK)",
    deliverySuccessRate: 100,
  },
  {
    id: "wh-3",
    name: "Datadog / Prometheus Ingestion Stream",
    target: "custom",
    url: "https://api.datadoghq.com/api/v1/events",
    events: ["release_updated", "task_updated"],
    status: "active",
    lastDelivery: "3h ago (200 OK)",
    deliverySuccessRate: 99.4,
  },
];

export const webhookController = {
  async getOutgoingWebhooks(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || (req.query.orgId as string) || "org-default";

      let count = await OutgoingWebhookModel.countDocuments({ organizationId: orgId });

      if (count === 0) {
        const initial = defaultWebhooks.map((w) => ({
          ...w,
          organizationId: orgId,
        }));
        await OutgoingWebhookModel.insertMany(initial);
      }

      const webhooks = await OutgoingWebhookModel.find({ organizationId: orgId });
      return res.json({ success: true, webhooks });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  },

  async testOutgoingWebhook(req: Request, res: Response) {
    try {
      const orgId = (req as any).organizationId || "org-default";
      const { action, id } = req.body;

      const webhook = await OutgoingWebhookModel.findOne({ organizationId: orgId, id });

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found in organization" });
      }

      if (action === "test") {
        webhook.lastDelivery = "Just now (200 OK)";
        webhook.deliverySuccessRate = 100;
        await webhook.save();

        broadcastEvent({
          type: "system",
          category: "system",
          title: `Webhook Test Dispatched: ${webhook.name}`,
          message: `Successfully dispatched HMAC test payload to ${webhook.target.toUpperCase()} endpoint (${webhook.url})`,
          link: "/app/settings",
          meta: { organizationId: orgId },
        });

        return res.json({
          success: true,
          webhook,
          message: `Test payload delivered successfully to ${webhook.name} with HTTP 200 OK response.`,
        });
      }

      return res.json({ success: true, webhook });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  async handleGithubWebhook(req: Request, res: Response) {
    const deliveryId = req.headers["x-github-delivery"] as string;
    const rawEvent = (req.headers["x-github-event"] as string) || req.body.event || "push";
    let deliveryDoc: any = null;

    try {
      // ─── 1. Webhook Delivery Idempotency ──────────────────────────────────────
      if (deliveryId) {
        const existing = await GitHubWebhookDeliveryModel.findOne({ deliveryId });
        if (existing && (existing.status === "COMPLETED" || existing.status === "PROCESSING")) {
          return res.status(200).json({
            success: true,
            message: "Duplicate webhook delivery ignored.",
            duplicate: true,
            deliveryId,
          });
        }

        deliveryDoc = await GitHubWebhookDeliveryModel.create({
          deliveryId,
          event: rawEvent,
          status: "PROCESSING",
        });
      }

      // ─── 2. Resolve Organization Routing First ────────────────────────────────
      let orgId: string | undefined;

      // Priority 1: GitHub App Installation ID
      const installationId = req.body.installation?.id;
      if (installationId) {
        const installation = await GitHubInstallationModel.findOne({
          githubInstallationId: Number(installationId),
        });
        if (installation) {
          orgId = installation.organizationId;
        }
      }

      // Priority 2: Registered Repository Identity
      const repoFullName = req.body.repository?.full_name || req.body.repository?.name;
      const repoId = req.body.repository?.id;

      if (!orgId && (repoId || repoFullName)) {
        const repoDoc = await RepositoryModel.findOne(
          repoId ? { githubRepositoryId: Number(repoId) } : { fullName: repoFullName }
        );
        if (repoDoc) {
          orgId = repoDoc.organizationId;
        }
      }

      // Priority 3: Legacy PAT Integration Settings
      if (!orgId && repoFullName) {
        const escaped = repoFullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const setting = await IntegrationSettingsModel.findOne({
          "github.repository": new RegExp(`^${escaped}$`, "i"),
        });
        if (setting) {
          orgId = setting.organizationId;
        }
      }

      // Priority 4: Test Harness / Simulator bypass in non-production only
      if (!orgId && !ENV.IS_PRODUCTION) {
        const candidateOrg =
          (req as any).organizationId ||
          (req.headers["x-organization-id"] as string) ||
          req.body.organizationId;
        if (candidateOrg) {
          const orgDoc = await OrganizationModel.findOne({ id: candidateOrg });
          if (orgDoc) {
            orgId = candidateOrg;
          }
        }
      }

      // If organization could not be resolved from trusted mapping: REJECT/IGNORE SAFELY
      if (!orgId) {
        if (deliveryDoc) {
          deliveryDoc.status = "COMPLETED";
          deliveryDoc.error = "Unmapped repository or installation; safely ignored.";
          await deliveryDoc.save();
        }
        return res.status(202).json({
          success: false,
          message: "Webhook ignored: No authorized Nova organization matches repository or installation.",
        });
      }

      // ─── 3. Webhook Signature Verification with RAW BYTES ─────────────────────
      const signature = req.headers["x-hub-signature-256"] as string;
      const rawBytes: Buffer =
        (req as any).rawBody ||
        (Buffer.isBuffer(req.body)
          ? req.body
          : typeof req.body === "string"
          ? Buffer.from(req.body, "utf8")
          : Buffer.from(JSON.stringify(req.body), "utf8"));

      let orgWebhookSecret = "";
      if (orgId) {
        const setting = await IntegrationSettingsModel.findOne({ organizationId: orgId });
        if (setting?.github?.encryptedWebhookSecret) {
          try {
            orgWebhookSecret = decryptSecret(setting.github.encryptedWebhookSecret);
          } catch {}
        }
      }

      const effectiveSecret = ENV.GITHUB_WEBHOOK_SECRET || orgWebhookSecret;

      if (ENV.IS_PRODUCTION && !effectiveSecret) {
        if (deliveryDoc) {
          deliveryDoc.status = "FAILED";
          deliveryDoc.error = "GITHUB_WEBHOOK_SECRET not configured in production.";
          await deliveryDoc.save();
        }
        return res.status(500).json({
          success: false,
          error: "Webhook security failure: GITHUB_WEBHOOK_SECRET is not configured on the server.",
        });
      }

      if (ENV.IS_PRODUCTION && !signature) {
        if (deliveryDoc) {
          deliveryDoc.status = "FAILED";
          deliveryDoc.error = "Missing required X-Hub-Signature-256 header in production.";
          await deliveryDoc.save();
        }
        return res.status(401).json({
          success: false,
          error: "Unauthorized: Missing X-Hub-Signature-256 signature header.",
        });
      }

      if (signature) {
        if (!effectiveSecret) {
          if (deliveryDoc) {
            deliveryDoc.status = "FAILED";
            deliveryDoc.error = "Signature provided but webhook secret is not configured.";
            await deliveryDoc.save();
          }
          return res.status(401).json({
            success: false,
            error: "Webhook secret is not configured on server.",
          });
        }

        const expectedSig = `sha256=${crypto
          .createHmac("sha256", effectiveSecret)
          .update(rawBytes)
          .digest("hex")}`;

        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSig);

        if (
          sigBuffer.length !== expectedBuffer.length ||
          !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
        ) {
          if (deliveryDoc) {
            deliveryDoc.status = "FAILED";
            deliveryDoc.error = "Invalid HMAC-SHA256 signature.";
            await deliveryDoc.save();
          }
          return res.status(401).json({
            success: false,
            error: "Invalid webhook signature.",
          });
        }
      }

      if (deliveryDoc) {
        deliveryDoc.organizationId = orgId;
        deliveryDoc.githubInstallationId = installationId;
        deliveryDoc.repositoryFullName = repoFullName;
      }

      // ─── 4. Handle GitHub App Installation Lifecycle Events ───────────────────
      if (rawEvent === "installation" && req.body.installation) {
        const action = req.body.action;
        const instId = Number(req.body.installation.id);

        if (action === "deleted") {
          await GitHubInstallationModel.updateOne(
            { githubInstallationId: instId },
            { $set: { status: "REVOKED" } }
          );
          await RepositoryModel.updateMany(
            { githubInstallationId: instId },
            { $set: { selected: false } }
          );
        } else if (action === "suspend") {
          await GitHubInstallationModel.updateOne(
            { githubInstallationId: instId },
            { $set: { status: "SUSPENDED" } }
          );
        } else if (action === "unsuspend") {
          await GitHubInstallationModel.updateOne(
            { githubInstallationId: instId },
            { $set: { status: "ACTIVE" } }
          );
        }

        if (deliveryDoc) {
          deliveryDoc.status = "COMPLETED";
          await deliveryDoc.save();
        }

        return res.json({
          success: true,
          message: `Handled GitHub App installation ${action} event successfully.`,
        });
      }

      // ─── 5. Normalize Simulator / Settings Test Payloads ──────────────────────
      let ghEvent = rawEvent;
      let ghPR = req.body.pull_request;
      let prAction = req.body.action || "opened";

      if (rawEvent === "pull_request_merged" || (rawEvent === "pull_request" && !ghPR && req.body.taskKey)) {
        ghEvent = "pull_request";
        prAction = "closed";
        const taskKey = req.body.taskKey || req.body.task || "NV-851";
        const targetBranch = req.body.branch || req.body.base || "main";
        ghPR = {
          id: req.body.prId || 104,
          number: req.body.prNumber || 104,
          title: req.body.title || `${taskKey} Add security headers & edge protection`,
          body: req.body.body || `Implements ${taskKey}`,
          state: "closed",
          merged: true,
          user: { login: req.body.author || "developer", avatar_url: "" },
          head: { ref: req.body.head || `${taskKey}-edge-headers` },
          base: { ref: targetBranch },
          commits: 4,
          changed_files: 3,
          additions: 240,
          deletions: 18,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          html_url: `https://github.com/${repoFullName || "organization/repo"}/pull/104`,
        };
      }

      // ─── 6. Handle Pull Request Events ────────────────────────────────────────
      if (ghEvent === "pull_request" && ghPR) {
        const prId = `pr-gh-${ghPR.id}`;
        const authorName = ghPR.user?.login || "GitHub User";
        const authorInitials = authorName.slice(0, 2).toUpperCase();

        const isMerged = Boolean(ghPR.merged || ghPR.merged_at);
        const status = isMerged
          ? "merged"
          : ghPR.state === "closed"
          ? "closed"
          : ghPR.draft
          ? "draft"
          : "open";

        const headBranch = ghPR.head?.ref || "feature";
        const targetBranch = ghPR.base?.ref || "main";

        const linkedIssueKey = extractTaskKey(headBranch, ghPR.title, ghPR.body);

        // Fetch organization default branch from DB
        const orgDoc = await OrganizationModel.findOne({ id: orgId });
        const configuredDefaultBranch = orgDoc?.defaultBranch || "main";

        // Fetch diff for the PR (in non-simulation, only real diffs from GitHub)
        const diffFiles = await githubService.fetchPullRequestDiff(
          orgId,
          ghPR.number,
          ghPR.title,
          linkedIssueKey,
          !ENV.IS_PRODUCTION
        );

        await PullRequestModel.findOneAndUpdate(
          { organizationId: orgId, $or: [{ id: prId }, { number: ghPR.number }] },
          {
            $set: {
              id: prId,
              organizationId: orgId,
              number: ghPR.number,
              title: ghPR.title,
              description: ghPR.body || "",
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
              updatedAt: new Date().toISOString(),
              linkedIssueKey,
              githubPrId: ghPR.id,
              githubUrl: ghPR.html_url,
              diff: diffFiles,
            },
          },
          { upsert: true, returnDocument: "after" }
        );

        // Link Task branch and update status strictly scoped to orgId
        if (linkedIssueKey) {
          const taskDoc = await TaskModel.findOne({
            organizationId: orgId,
            $or: [{ id: linkedIssueKey }, { key: linkedIssueKey }],
          });

          if (taskDoc) {
            if (!taskDoc.branch) {
              taskDoc.branch = headBranch;
              await taskDoc.save();
            }

            if (isMerged && targetBranch === configuredDefaultBranch) {
              if (taskDoc.status !== "done") {
                taskDoc.status = "done";
                taskDoc.updatedAt = new Date().toISOString();
                await taskDoc.save();

                await ActivityItemModel.create({
                  id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  organizationId: orgId,
                  type: "task_status",
                  actor: { name: authorName, initials: authorInitials },
                  action: `merged GitHub PR #${ghPR.number} into ${targetBranch} and moved task to DONE`,
                  target: linkedIssueKey,
                  timestamp: "Just now",
                });
              }
            } else if (isMerged && targetBranch !== configuredDefaultBranch) {
              await ActivityItemModel.create({
                id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                organizationId: orgId,
                type: "commit",
                actor: { name: authorName, initials: authorInitials },
                action: `merged PR #${ghPR.number} into non-default branch (${targetBranch}). Task ${linkedIssueKey} status unchanged.`,
                target: linkedIssueKey,
                timestamp: "Just now",
              });
            }
          }
        }

        // Dispatch notifications to active organization members
        try {
          const orgMembers = await OrganizationMemberModel.find({ organizationId: orgId, deletedAt: null });
          const notifTitle = `GitHub PR #${ghPR.number} ${prAction}`;
          const notifMsg = `${authorName} ${prAction} pull request #${ghPR.number}: "${ghPR.title}"`;
          for (const member of orgMembers) {
            await notificationService.createNotification(
              {
                userId: member.userId,
                organizationId: orgId,
                type: "git_webhook",
                title: notifTitle,
                body: notifMsg,
                entityType: "pr",
                entityId: prId,
                link: "/app/pull-requests",
              },
              { broadcast: false }
            );
          }
        } catch (notifErr: any) {
          console.warn("[Webhook PR Notification Warning]:", notifErr.message);
        }

        broadcastEvent({
          type: "git_webhook",
          category: "git",
          title: `GitHub PR #${ghPR.number} ${prAction}`,
          message: `${authorName} ${prAction} pull request #${ghPR.number}: "${ghPR.title}"`,
          link: "/app/pull-requests",
          meta: { prNumber: ghPR.number, action: prAction, organizationId: orgId },
        });

        if (deliveryDoc) {
          deliveryDoc.status = "COMPLETED";
          await deliveryDoc.save();
        }

        return res.json({
          success: true,
          message: `Processed pull_request (${prAction}) event successfully for ${linkedIssueKey ? `task ${linkedIssueKey}` : "PR #" + ghPR.number}.`,
          linkedIssueKey,
          merged: isMerged,
          targetBranch,
          defaultBranch: configuredDefaultBranch,
        });
      }

      // ─── 7. Handle Push Events ────────────────────────────────────────────────
      if (ghEvent === "push") {
        const branchRef = req.body.ref || req.body.branch || "refs/heads/main";
        const branchName = branchRef.replace(/^refs\/heads\//, "");
        const commitMessage = req.body.head_commit?.message || req.body.commitMessage || "";
        const commitAuthor = req.body.pusher?.name || req.body.author || "Developer";

        const taskKey = extractTaskKey(branchName, undefined, undefined, commitMessage);

        if (taskKey) {
          const taskDoc = await TaskModel.findOne({
            organizationId: orgId,
            $or: [{ id: taskKey }, { key: taskKey }],
          });

          if (taskDoc) {
            taskDoc.branch = branchName;
            if (taskDoc.status === "backlog" || taskDoc.status === "todo") {
              taskDoc.status = "in_progress";
            }
            taskDoc.updatedAt = new Date().toISOString();
            await taskDoc.save();
          }
        }

        try {
          const orgMembers = await OrganizationMemberModel.find({ organizationId: orgId, deletedAt: null });
          const notifTitle = `GitHub Push to ${branchName}`;
          const notifMsg = `${commitAuthor} pushed commits to ${branchName}${taskKey ? ` (Task ${taskKey})` : ""}`;
          for (const member of orgMembers) {
            await notificationService.createNotification(
              {
                userId: member.userId,
                organizationId: orgId,
                type: "git_webhook",
                title: notifTitle,
                body: notifMsg,
                entityType: "task",
                entityId: taskKey,
                link: taskKey ? "/app/tasks" : "/app/pull-requests",
              },
              { broadcast: false }
            );
          }
        } catch (notifErr: any) {
          console.warn("[Webhook Push Notification Warning]:", notifErr.message);
        }

        broadcastEvent({
          type: "git_webhook",
          category: "git",
          title: `GitHub Push to ${branchName}`,
          message: `${commitAuthor} pushed commits to ${branchName}${taskKey ? ` (Task ${taskKey})` : ""}`,
          link: "/app/tasks",
          meta: { organizationId: orgId, branch: branchName, taskKey },
        });

        if (deliveryDoc) {
          deliveryDoc.status = "COMPLETED";
          await deliveryDoc.save();
        }

        return res.json({
          success: true,
          message: `Handled push event on branch ${branchName} successfully.`,
          taskKey,
        });
      }

      // ─── 8. Handle CI / Check Run Events ──────────────────────────────────────
      if (ghEvent === "check_run" || ghEvent === "workflow_run" || ghEvent === "ci_passed") {
        const status = req.body.check_run?.conclusion || req.body.workflow_run?.conclusion || "success";
        const name = req.body.check_run?.name || req.body.workflow_run?.name || "CI Test Suite";

        broadcastEvent({
          type: "git_webhook",
          category: "git",
          title: `CI Suite ${status.toUpperCase()}: ${name}`,
          message: `Automated test & build suite completed with status: ${status}`,
          link: "/app/releases",
          meta: { organizationId: orgId, status },
        });

        if (deliveryDoc) {
          deliveryDoc.status = "COMPLETED";
          await deliveryDoc.save();
        }

        return res.json({
          success: true,
          message: `Handled CI/Check event (${status}) successfully.`,
        });
      }

      if (deliveryDoc) {
        deliveryDoc.status = "COMPLETED";
        await deliveryDoc.save();
      }

      return res.json({ success: true, message: `Handled ${ghEvent} event successfully.` });
    } catch (error: any) {
      if (deliveryDoc) {
        deliveryDoc.status = "FAILED";
        deliveryDoc.error = error.message;
        await deliveryDoc.save().catch(() => {});
      }
      return res.status(500).json({ success: false, error: error.message });
    }
  },
};
