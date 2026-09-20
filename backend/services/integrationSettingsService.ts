import nodemailer from "nodemailer";
import { IntegrationSettingsModel } from "../models/IntegrationSettings";
import { encryptSecret, decryptSecret } from "./cryptoService";
import { ENV } from "../config/env";

function isRealValue(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (trimmed.length < 3) return false;
  if (trimmed.startsWith("xxxx") || trimmed.includes("xxxx")) return false;
  if (trimmed === "organization/repo") return false;
  return true;
}

export const integrationSettingsService = {
  async getSettings(organizationId: string) {
    const doc = await IntegrationSettingsModel.findOne({ organizationId });

    const hasDbSmtp = Boolean(doc?.smtp?.host && isRealValue(doc.smtp.host));
    const hasEnvSmtp = Boolean(ENV.SMTP_HOST && isRealValue(ENV.SMTP_HOST) && ENV.EMAIL_ENABLED);
    const smtpConfigured = Boolean((doc?.smtp?.enabled && hasDbSmtp) || hasEnvSmtp);

    const hasDbGithub = Boolean(doc?.github?.clientId && isRealValue(doc.github.clientId));
    const hasEnvGithub = Boolean(ENV.GITHUB_CLIENT_ID && isRealValue(ENV.GITHUB_CLIENT_ID));
    const rawGithubClientId = hasDbGithub ? doc!.github!.clientId : (hasEnvGithub ? ENV.GITHUB_CLIENT_ID : "");
    const githubRepository = isRealValue(doc?.github?.repository) ? doc!.github!.repository! : "";

    const isGithubConfigured = Boolean(
      (doc?.github?.enabled ?? hasEnvGithub) &&
      isRealValue(rawGithubClientId)
    );

    return {
      smtp: {
        configured: smtpConfigured,
        enabled: doc?.smtp?.enabled ?? Boolean(ENV.EMAIL_ENABLED),
        host: doc?.smtp?.host || (hasEnvSmtp ? ENV.SMTP_HOST : ""),
        port: doc?.smtp?.port || ENV.SMTP_PORT || 587,
        secure: doc?.smtp?.secure ?? ENV.SMTP_SECURE,
        user: doc?.smtp?.user || (ENV.SMTP_USER && isRealValue(ENV.SMTP_USER) ? `${ENV.SMTP_USER.slice(0, 3)}••••` : ""),
        from: doc?.smtp?.from || ENV.SMTP_FROM || "noreply@nova.app",
        hasPassword: Boolean(doc?.smtp?.encryptedPass || (hasEnvSmtp && ENV.SMTP_PASS)),
        lastTestedAt: doc?.smtp?.lastTestedAt,
        testStatus: doc?.smtp?.testStatus,
      },
      github: {
        configured: isGithubConfigured,
        enabled: doc?.github?.enabled ?? Boolean(hasEnvGithub && isGithubConfigured),
        clientId: rawGithubClientId ? (rawGithubClientId.length > 8 ? `${rawGithubClientId.slice(0, 4)}••••` : rawGithubClientId) : "",
        repository: githubRepository,
        hasSecret: Boolean(doc?.github?.encryptedClientSecret || (hasEnvGithub && isRealValue(ENV.GITHUB_CLIENT_SECRET))),
        lastTestedAt: doc?.github?.lastTestedAt,
        testStatus: isGithubConfigured ? (doc?.github?.testStatus || "untested") : undefined,
      },
    };
  },

  async saveSmtpSettings(input: {
    organizationId: string;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password?: string;
    from: string;
    enabled: boolean;
  }) {
    let doc = await IntegrationSettingsModel.findOne({ organizationId: input.organizationId });
    if (!doc) {
      doc = new IntegrationSettingsModel({ organizationId: input.organizationId });
    }

    let encryptedPass = doc.smtp?.encryptedPass || "";
    if (input.password && input.password.trim().length > 0) {
      encryptedPass = encryptSecret(input.password.trim());
    }

    doc.smtp = {
      host: input.host.trim(),
      port: input.port || 587,
      secure: Boolean(input.secure),
      user: input.user.trim(),
      encryptedPass,
      from: input.from.trim() || "noreply@nova.app",
      enabled: Boolean(input.enabled),
      lastTestedAt: doc.smtp?.lastTestedAt,
      testStatus: doc.smtp?.testStatus,
    };

    await doc.save();
    return this.getSettings(input.organizationId);
  },

  async testSmtpConnection(organizationId: string, testRecipient: string) {
    const doc = await IntegrationSettingsModel.findOne({ organizationId });
    
    // Resolve credentials (DB first, fallback to env)
    const host = doc?.smtp?.host || ENV.SMTP_HOST;
    const port = doc?.smtp?.port || ENV.SMTP_PORT;
    const secure = doc?.smtp?.secure ?? ENV.SMTP_SECURE;
    const user = doc?.smtp?.user || ENV.SMTP_USER;
    const pass = doc?.smtp?.encryptedPass ? decryptSecret(doc.smtp.encryptedPass) : ENV.SMTP_PASS;
    const from = doc?.smtp?.from || ENV.SMTP_FROM || "noreply@nova.app";

    if (!host || !user || !pass) {
      throw new Error("SMTP host, user, and password must be configured before testing.");
    }

    const transporter: any = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
    });

    try {
      await transporter.verify();
      
      // Dispatch test message
      const info = await transporter.sendMail({
        from: `"${from.split("@")[0]}" <${from}>`,
        to: testRecipient,
        subject: "NOVA Workspace — SMTP Integration Test (Verified)",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
            <h2 style="color: #10b981;">SMTP Connection Verified!</h2>
            <p>Your SMTP credentials configured in NOVA Workspace are fully operational and sending verified mail.</p>
            <p style="font-size: 12px; color: #6b7280;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      });

      if (doc) {
        if (!doc.smtp) doc.smtp = {} as any;
        doc.smtp!.lastTestedAt = new Date();
        doc.smtp!.testStatus = "passed";
        await doc.save();
      }

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      if (doc) {
        if (!doc.smtp) doc.smtp = {} as any;
        doc.smtp!.lastTestedAt = new Date();
        doc.smtp!.testStatus = "failed";
        await doc.save();
      }
      throw new Error(`SMTP validation failed: ${err.message}`);
    }
  },

  async saveGithubSettings(input: {
    organizationId: string;
    clientId: string;
    clientSecret?: string;
    webhookSecret?: string;
    repository?: string;
    enabled: boolean;
  }) {
    let doc = await IntegrationSettingsModel.findOne({ organizationId: input.organizationId });
    if (!doc) {
      doc = new IntegrationSettingsModel({ organizationId: input.organizationId });
    }

    let encryptedClientSecret = doc.github?.encryptedClientSecret || "";
    if (input.clientSecret && input.clientSecret.trim().length > 0) {
      encryptedClientSecret = encryptSecret(input.clientSecret.trim());
    }

    let encryptedWebhookSecret = doc.github?.encryptedWebhookSecret || "";
    if (input.webhookSecret && input.webhookSecret.trim().length > 0) {
      encryptedWebhookSecret = encryptSecret(input.webhookSecret.trim());
    }

    doc.github = {
      clientId: input.clientId.trim(),
      encryptedClientSecret,
      encryptedWebhookSecret,
      repository: input.repository?.trim() || "",
      enabled: Boolean(input.enabled),
      lastTestedAt: doc.github?.lastTestedAt,
      testStatus: doc.github?.testStatus,
    };

    await doc.save();
    return this.getSettings(input.organizationId);
  },

  async testGithubConnection(organizationId: string) {
    const doc = await IntegrationSettingsModel.findOne({ organizationId });
    const clientId = isRealValue(doc?.github?.clientId)
      ? doc!.github!.clientId
      : (isRealValue(ENV.GITHUB_CLIENT_ID) ? ENV.GITHUB_CLIENT_ID : "");

    const clientSecret = doc?.github?.encryptedClientSecret
      ? decryptSecret(doc.github.encryptedClientSecret)
      : (isRealValue(ENV.GITHUB_CLIENT_SECRET) ? ENV.GITHUB_CLIENT_SECRET : "");

    const repository = isRealValue(doc?.github?.repository) ? doc!.github!.repository! : "";

    if (!clientId) {
      throw new Error("GitHub Client ID must be configured before testing.");
    }

    try {
      let probeMessage = "";
      if (repository && repository.includes("/")) {
        const headers: Record<string, string> = {
          "User-Agent": "Nova-Workspace-App",
          "Accept": "application/vnd.github.v3+json",
        };
        if (clientSecret) {
          const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
          headers["Authorization"] = `Basic ${authString}`;
        }
        const repoRes = await fetch(`https://api.github.com/repos/${repository}`, { headers });
        if (repoRes.status === 404) {
          throw new Error(`Repository "${repository}" not found on GitHub or private without valid credentials.`);
        }
        if (repoRes.status === 401) {
          throw new Error(`GitHub authentication rejected for "${repository}". Check your Client Secret.`);
        }
        if (!repoRes.ok) {
          throw new Error(`GitHub API returned HTTP ${repoRes.status} for repository "${repository}".`);
        }
        const repoData: any = await repoRes.json();
        probeMessage = `Verified live repository "${repoData.full_name}" (Default branch: ${repoData.default_branch || "main"}, Stars: ${repoData.stargazers_count ?? 0}).`;
      } else {
        const res = await fetch("https://api.github.com/zen", {
          headers: { "User-Agent": "Nova-Workspace-App" },
        });
        if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status}`);
        const zen = await res.text();
        probeMessage = `GitHub API reachable (${zen.trim()}). Enter Target Repository (owner/repo) to verify repository access.`;
      }

      if (doc) {
        if (!doc.github) doc.github = {} as any;
        doc.github!.lastTestedAt = new Date();
        doc.github!.testStatus = "passed";
        await doc.save();
      }

      return {
        success: true,
        message: probeMessage,
      };
    } catch (err: any) {
      if (doc) {
        if (!doc.github) doc.github = {} as any;
        doc.github!.lastTestedAt = new Date();
        doc.github!.testStatus = "failed";
        await doc.save();
      }
      throw new Error(`GitHub connection probe failed: ${err.message}`);
    }
  },
};
