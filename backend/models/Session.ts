import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Session ──────────────────────────────────────────────────────────────────
// Persistent server-side sessions. Replaces the in-memory sessions Map.
// Tokens are stored as SHA-256 hashes — the raw token is only held by the client
// in an HttpOnly cookie.

export interface ISession {
  _id: mongoose.Types.ObjectId;
  tokenHash: string;         // SHA-256 of the raw token — stored, never raw
  userId: string;
  organizationId?: string;   // resolved on first request if not set
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends ISession, Document {}

const SessionSchema = new Schema<ISessionDocument>(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    userAgent: { type: String },
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }, // TTL index
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SessionModel: Model<ISessionDocument> =
  mongoose.models.Session ||
  mongoose.model<ISessionDocument>("Session", SessionSchema);
