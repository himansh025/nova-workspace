import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIConversation {
  id: string;
  userId: string;
  organizationId: string;
  provider: string;
  selectedModel: string;
  title: string;
  repositoryId?: string;
  branch?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIConversationDocument extends Document {
  id: string;
  userId: string;
  organizationId: string;
  provider: string;
  selectedModel: string;
  title: string;
  repositoryId?: string;
  branch?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIConversationSchema = new Schema<IAIConversationDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    provider: { type: String, default: "google" },
    selectedModel: { type: String, default: "gemini-2.5-flash" },
    title: { type: String, default: "New Conversation" },
    repositoryId: { type: String },
    branch: { type: String },
  },
  { timestamps: true }
);

AIConversationSchema.index({ organizationId: 1, userId: 1, updatedAt: -1 });

export const AIConversationModel: Model<IAIConversationDocument> =
  mongoose.models.AIConversation ||
  mongoose.model<IAIConversationDocument>("AIConversation", AIConversationSchema);
