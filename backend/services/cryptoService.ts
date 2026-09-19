import argon2 from "argon2";
import crypto from "crypto";
import { ENV } from "../config/env";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Derives a 32-byte key from SESSION_SECRET for symmetric encryption of sensitive credentials (e.g. AI API keys).
 */
function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(ENV.SESSION_SECRET).digest();
}

/**
 * Hash a plaintext password using Argon2id with server pepper.
 */
export async function hashPassword(password: string): Promise<string> {
  const peppered = `${password}:${ENV.ARGON2_PEPPER}`;
  return argon2.hash(peppered, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !password) return false;
  try {
    const peppered = `${password}:${ENV.ARGON2_PEPPER}`;
    return await argon2.verify(hash, peppered);
  } catch {
    return false;
  }
}

/**
 * Encrypt sensitive text (such as AI API keys) using AES-256-GCM.
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Return formatted string: iv:authTag:encryptedContent (all hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt sensitive text encrypted with AES-256-GCM.
 */
export function decryptSecret(cipherText: string): string {
  if (!cipherText || !cipherText.includes(":")) return "";
  try {
    const [ivHex, tagHex, contentHex] = cipherText.split(":");
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");
    const content = Buffer.from(contentHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    return decrypted.toString("utf8");
  } catch (err) {
    console.error("[cryptoService] Failed to decrypt secret:", err);
    return "";
  }
}

/**
 * Generates a high-entropy random token (raw) and its SHA-256 hash.
 */
export function generateTokenWithHash(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, tokenHash };
}

/**
 * SHA-256 hashes an existing raw token.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}
