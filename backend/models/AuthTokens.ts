import mongoose, { Schema, Document, Model } from "mongoose";

// ─── EmailVerificationToken ───────────────────────────────────────────────────
export interface IEmailVerificationToken {
  _id: mongoose.Types.ObjectId;
  userId: string;
  tokenHash: string;   // SHA-256 hash of the raw token
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface IEmailVerificationTokenDocument
  extends IEmailVerificationToken,
    Document {}

const EmailVerificationTokenSchema =
  new Schema<IEmailVerificationTokenDocument>(
    {
      userId: { type: String, required: true, index: true },
      tokenHash: { type: String, required: true, unique: true, index: true },
      expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 },
      },
      usedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

export const EmailVerificationTokenModel: Model<IEmailVerificationTokenDocument> =
  mongoose.models.EmailVerificationToken ||
  mongoose.model<IEmailVerificationTokenDocument>(
    "EmailVerificationToken",
    EmailVerificationTokenSchema
  );

// ─── PasswordResetToken ───────────────────────────────────────────────────────
export interface IPasswordResetToken {
  _id: mongoose.Types.ObjectId;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface IPasswordResetTokenDocument
  extends IPasswordResetToken,
    Document {}

const PasswordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const PasswordResetTokenModel: Model<IPasswordResetTokenDocument> =
  mongoose.models.PasswordResetToken ||
  mongoose.model<IPasswordResetTokenDocument>(
    "PasswordResetToken",
    PasswordResetTokenSchema
  );
