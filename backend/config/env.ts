import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// ─── Environment Validation ───────────────────────────────────────────────────
// In production, fail fast if critical env vars are missing.
// In development, use safe defaults with clear warnings.

const REQUIRED_IN_PRODUCTION: string[] = [
  "MONGODB_URI",
  "SESSION_SECRET",
  "CORS_ORIGIN",
];

function validateEnv(): void {
  const mode = process.env.APP_MODE || process.env.NODE_ENV || "development";
  if (mode === "production") {
    const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
    const missing = REQUIRED_IN_PRODUCTION.filter((k) => {
      if (k === "SESSION_SECRET") return !sessionSecret;
      return !process.env[k];
    });
    if (missing.length > 0) {
      console.error(
        `[ENV] FATAL: Missing required production environment variables:\n  ${missing.join("\n  ")}\n\nSet these in your environment before starting in production mode.`
      );
      process.exit(1);
    }
  }

  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "nova_jwt_secret_dev") {
    console.warn(
      "[ENV] WARNING: SESSION_SECRET is using an insecure default. Set a strong random value in production."
    );
  }
}

validateEnv();

const corsEnv = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : [];

export const ENV = {
  PORT: Number(process.env.PORT || process.env.EXPRESS_PORT || 5000),
  NODE_ENV: process.env.NODE_ENV || "development",
  APP_MODE: (process.env.APP_MODE || process.env.NODE_ENV || "development") as "development" | "production" | "test",
  IS_PRODUCTION: (process.env.APP_MODE || process.env.NODE_ENV) === "production",

  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nova-workspace",

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || "nova_jwt_secret_dev",
  SESSION_EXPIRY_DAYS: Number(process.env.SESSION_EXPIRY_DAYS || 7),

  // CORS
  CORS_ORIGINS: [
    ...corsEnv,
    "http://localhost:3000",
    "http://localhost:3007",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3007",
  ],

  // Email (SMTP)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@nova.app",
  EMAIL_ENABLED: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),

  // App URL (used in email links)
  APP_URL: process.env.APP_URL || "http://localhost:3007",

  // GitHub App & Webhook Configuration
  get GITHUB_APP_ID(): string {
    return process.env.GITHUB_APP_ID || "";
  },
  get GITHUB_CLIENT_ID(): string {
    return process.env.GITHUB_CLIENT_ID || "";
  },
  get GITHUB_CLIENT_SECRET(): string {
    return process.env.GITHUB_CLIENT_SECRET || "";
  },
  get GITHUB_PRIVATE_KEY(): string {
    return process.env.GITHUB_PRIVATE_KEY || "";
  },
  get GITHUB_WEBHOOK_SECRET(): string {
    return process.env.GITHUB_WEBHOOK_SECRET || "";
  },
  get GITHUB_APP_URL(): string {
    return process.env.GITHUB_APP_URL || "";
  },
  get GITHUB_CALLBACK_URL(): string {
    return process.env.GITHUB_CALLBACK_URL || "";
  },
  get CREDENTIAL_ENCRYPTION_KEY(): string {
    return process.env.CREDENTIAL_ENCRYPTION_KEY || "";
  },

  // GitLab OAuth (optional)
  GITLAB_CLIENT_ID: process.env.GITLAB_CLIENT_ID || "",
  GITLAB_CLIENT_SECRET: process.env.GITLAB_CLIENT_SECRET || "",
  GITLAB_WEBHOOK_SECRET: process.env.GITLAB_WEBHOOK_SECRET || "",

  // Argon2 pepper — adds a server-side secret to password hashes
  ARGON2_PEPPER: process.env.ARGON2_PEPPER || "nova_argon2_pepper_dev_change_in_prod",

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 min
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX || 100),
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX || 10),
};
