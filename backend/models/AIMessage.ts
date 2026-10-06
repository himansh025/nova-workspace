import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContextSource {
  path: string;
  size?: number;
  linesCount?: number;
}

export interface IMessageUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  durationMs?: number;
}

export interface IAIMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  userId: string;
  role: "user" | "assistant" | "system";
  content: string;
  contextMetadata?: {
    repositoryFullName?: string;
    branch?: string;
    sources?: IContextSource[];
    truncated?: boolean;
  };
  usage?: IMessageUsage;
  createdAt: Date;
}

export interface IAIMessageDocument extends IAIMessage, Document {}

const AIMessageSchema = new Schema<IAIMessageDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    contextMetadata: {
      repositoryFullName: { type: String },
      branch: { type: String },
      sources: [
        {
          path: { type: String },
          size: { type: Number },
          linesCount: { type: Number },
        },
      ],
      truncated: { type: Boolean, default: false },
    },
    usage: {
      promptTokens: { type: Number },
      completionTokens: { type: Number },
      totalTokens: { type: Number },
      durationMs: { type: Number },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AIMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const AIMessageModel: Model<IAIMessageDocument> =
  mongoose.models.AIMessage ||
  mongoose.model<IAIMessageDocument>("AIMessage", AIMessageSchema);
