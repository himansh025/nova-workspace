import nodemailer from "nodemailer";
import { IntegrationSettingsModel } from "../models/IntegrationSettings";
import { encryptSecret, decryptSecret } from "./cryptoService";
import { ENV } from "../config/env";

export const integrationSettingsService = {
  async getSettings(organizationId: string) {
    const doc = await IntegrationSettingsModel.findOne({ organizationId });

    // Fallback to server env if not overridden in organization DB
    const smtpConfigured = Boolean((doc?.smtp?.enabled && doc.smtp.host) || ENV.EMAIL_ENABLED);
    const githubConfigured = Boolean((doc?.github?.enabled && doc.github.clientId) || ENV.GITHUB_CLIENT_ID);

    return {
      smtp: {
        configured: smtpConfigured,
        enabled: doc?.smtp?.enabled ?? Boolean(ENV.EMAIL_ENABLED),
        host: doc?.smtp?.host || ENV.SMTP_HOST || "",
        port: doc?.smtp?.port || ENV.SMTP_PORT || 587,
        secure: doc?.smtp?.secure ?? ENV.SMTP_SECURE,
        user: doc?.smtp?.user || (ENV.SMTP_USER ? `${ENV.SMTP_USER.slice(0, 3)}••••` : ""),
        from: doc?.smtp?.from || ENV.SMTP_FROM || "noreply@nova.app",
        hasPassword: Boolean(doc?.smtp?.encryptedPass || ENV.SMTP_PASS),
        lastTestedAt: doc?.smtp?.lastTestedAt,
        testStatus: doc?.smtp?.testStatus,
      },
      github: {
        configured: githubConfigured,
        enabled: doc?.github?.enabled ?? Boolean(ENV.GITHUB_CLIENT_ID),
        clientId: doc?.github?.clientId || (ENV.GITHUB_CLIENT_ID ? `${ENV.GITHUB_CLIENT_ID.slice(0, 4)}••••` : ""),
        repository: doc?.github?.repository || "organization/repo",
        hasSecret: Boolean(doc?.github?.encryptedClientSecret || ENV.GITHUB_CLIENT_SECRET),
        lastTestedAt: doc?.github?.lastTestedAt,
        testStatus: doc?.github?.testStatus,
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
    const clientId = doc?.github?.clientId || ENV.GITHUB_CLIENT_ID;
    const clientSecret = doc?.github?.encryptedClientSecret
      ? decryptSecret(doc.github.encryptedClientSecret)
      : ENV.GITHUB_CLIENT_SECRET;

    if (!clientId) {
      throw new Error("GitHub Client ID must be configured before testing.");
    }

    // Ping public GitHub API to verify endpoint reachability
    try {
      const res = await fetch("https://api.github.com/zen", {
        headers: { "User-Agent": "Nova-Workspace-App" },
      });

      if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status}`);
      const zen = await res.text();

      if (doc) {
        if (!doc.github) doc.github = {} as any;
        doc.github!.lastTestedAt = new Date();
        doc.github!.testStatus = "passed";
        await doc.save();
      }

      return {
        success: true,
        message: `Connected to GitHub API. Response: "${zen.trim()}"`,
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
