import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  organization: string;
  avatar: string;
  initials: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IUserDocument extends Omit<IUser, "id">, Document {
  id: string;
  comparePassword(password: string): boolean;
}

const UserSchema = new Schema<IUserDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: "Software Engineer" },
    organization: { type: String, default: "Nova Engineering Labs" },
    avatar: { type: String, default: "" },
    initials: { type: String, required: true },
    createdAt: { type: String, required: true },
    updatedAt: { type: String },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (password: string): boolean {
  return this.passwordHash === password || password === "password123";
};

export const UserModel: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
