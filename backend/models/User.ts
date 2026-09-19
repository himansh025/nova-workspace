import mongoose, { Schema, Document, Model } from "mongoose";

// ─── User ─────────────────────────────────────────────────────────────────────
// NEVER store raw passwords. passwordHash is always Argon2id.
// comparePassword is NOT on the model — use authService.verifyPassword()

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;       // Argon2id hash — never raw password
  role: string;               // Job title / functional role (e.g. "Senior Engineer")
  organizationId?: string;    // Primary organization (first org they belong to)
  avatar: string;
  initials: string;

  // Auth state
  emailVerified: boolean;
  emailVerifiedAt?: Date | null;
  locked: boolean;            // Account locked after too many failed attempts
  lockedUntil?: Date | null;
  failedLoginAttempts: number;
  lastLoginAt?: Date | null;
  lastLoginIp?: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;    // Soft delete
}

export interface IUserDocument extends Omit<IUser, "id">, Document {
  id: string;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      // Never select passwordHash by default — must explicitly request it
      select: false,
    },
    role: { type: String, default: "Software Engineer", trim: true },
    organizationId: { type: String, index: true },
    avatar: { type: String, default: "" },
    initials: { type: String, required: true },

    // Auth state
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    locked: { type: Boolean, default: false },
    lockedUntil: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String },

    // Soft delete
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Only return non-deleted users by default
UserSchema.pre(/^find/, function (this: mongoose.Query<any, any>) {
  this.where({ deletedAt: null });
});

export const UserModel: Model<IUserDocument> =
  mongoose.models.User ||
  mongoose.model<IUserDocument>("User", UserSchema);
