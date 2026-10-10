import mongoose, { Schema, Document, Model } from "mongoose";

// ─── OrgRole ──────────────────────────────────────────────────────────────────
export type OrgRole = "owner" | "admin" | "member" | "viewer";

// ─── OrganizationMember ───────────────────────────────────────────────────────
export interface IOrganizationMember {
  _id: mongoose.Types.ObjectId;
  organizationId: string;
  userId: string;
  role: OrgRole;
  /** Extra permissions on top of org role (set by owner/admin). */
  permissionGrants?: string[];
  /** Permissions removed from org role (set by owner/admin). */
  permissionRevokes?: string[];
  invitedBy?: string;
  joinedAt: Date;
  deletedAt?: Date | null;
}

export interface IOrganizationMemberDocument
  extends IOrganizationMember,
    Document {}

const OrganizationMemberSchema = new Schema<IOrganizationMemberDocument>(
  {
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["owner", "admin", "member", "viewer"],
      default: "member",
    },
    permissionGrants: { type: [String], default: [] },
    permissionRevokes: { type: [String], default: [] },
    invitedBy: { type: String },
    joinedAt: { type: Date, default: () => new Date() },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Composite unique: one user, one role per org
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const OrganizationMemberModel: Model<IOrganizationMemberDocument> =
  mongoose.models.OrganizationMember ||
  mongoose.model<IOrganizationMemberDocument>(
    "OrganizationMember",
    OrganizationMemberSchema
  );
