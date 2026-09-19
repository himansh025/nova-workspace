import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Organization ─────────────────────────────────────────────────────────────
export interface IOrganization {
  _id: mongoose.Types.ObjectId;
  id: string;
  name: string;
  slug: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface IOrganizationDocument extends IOrganization, Document {}

const OrganizationSchema = new Schema<IOrganizationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const OrganizationModel: Model<IOrganizationDocument> =
  mongoose.models.Organization ||
  mongoose.model<IOrganizationDocument>("Organization", OrganizationSchema);
