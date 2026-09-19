import nodemailer from "nodemailer";
import { ENV } from "../config/env";

let transporter: any = null;

function getTransporter(): any {
  if (transporter) return transporter;

  if (!ENV.EMAIL_ENABLED) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASS,
    },
  });

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const mailer = getTransporter();

  if (!mailer) {
    console.log(
      `[EmailService: Simulated] To: ${options.to} | Subject: "${options.subject}"\n(Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)`
    );
    return { success: true, simulated: true };
  }

  try {
    const info = await mailer.sendMail({
      from: `"${ENV.SMTP_FROM.split("@")[0]}" <${ENV.SMTP_FROM}>`,
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, ""),
      html: options.html,
    });

    console.log(`[EmailService] Sent email to ${options.to}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${options.to}:`, err);
    return { success: false };
  }
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const verifyUrl = `${ENV.APP_URL}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Welcome to NOVA Workspace, ${name}!</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        Please verify your email address to activate your account and access your organization's engineering workspace.
      </p>
      <div style="margin: 32px 0;">
        <a href="${verifyUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">
        Or paste this link into your browser: <br/>
        <a href="${verifyUrl}" style="color: #3b82f6;">${verifyUrl}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        This link expires in 24 hours. If you did not create an account on NOVA, you can safely ignore this email.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Verify your email on NOVA Workspace",
    html,
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string): Promise<void> {
  const resetUrl = `${ENV.APP_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <h2 style="color: #0f172a; margin-bottom: 16px;">Password Reset Request</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #475569;">
        Hi ${name}, we received a request to reset your NOVA Workspace password.
      </p>
      <div style="margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">
        Or paste this link into your browser: <br/>
        <a href="${resetUrl}" style="color: #ef4444;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        This link expires in 1 hour. If you did not request a password reset, please secure your account immediately.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: "Reset your password on NOVA Workspace",
    html,
  });
}
