import mongoose, { Schema, Document } from "mongoose";

export interface IPullRequestDiffChunk {
  header: string;
  lines: {
    type: "add" | "del" | "normal";
    oldLine?: number;
    newLine?: number;
    content: string;
  }[];
}

export interface IPullRequestDiffFile {
  filename: string;
  oldPath: string;
  newPath: string;
  chunks: IPullRequestDiffChunk[];
}

export interface IPullRequestFinding {
  id: string;
  type: "security" | "performance" | "suggestion";
  filename: string;
  lineNumber: number;
  title: string;
  message: string;
  suggestion?: string;
}

export interface IPullRequestAIReview {
  score: number;
  securityStatus: "PASSED" | "WARNING" | "CRITICAL";
  performanceImpact: string;
  summary: string;
  findings: IPullRequestFinding[];
}

export interface IPullRequestDoc extends Document {
  id: string;
  organizationId: string;
  number: number;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
  };
  branch: string;
  targetBranch: string;
  status: "open" | "merged" | "closed" | "draft";
  commitsCount: number;
  filesChangedCount: number;
  additions: number;
  deletions: number;
  createdAt: string;
  updatedAt?: string;
  linkedIssueKey?: string;
  githubPrId?: number;
  githubUrl?: string;
  diff: IPullRequestDiffFile[];
  aiReview?: IPullRequestAIReview;
}

const PullRequestSchema = new Schema<IPullRequestDoc>(
  {
    id: { type: String, required: true, unique: true },
    organizationId: { type: String, required: true, index: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    author: {
      name: { type: String, required: true },
      avatar: { type: String, default: "" },
      initials: { type: String, required: true },
    },
    branch: { type: String, required: true },
    targetBranch: { type: String, default: "main" },
    status: {
      type: String,
      enum: ["open", "merged", "closed", "draft"],
      default: "open",
      index: true,
    },
    commitsCount: { type: Number, default: 1 },
    filesChangedCount: { type: Number, default: 1 },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    linkedIssueKey: { type: String },
    githubPrId: { type: Number },
    githubUrl: { type: String },
    diff: [
      {
        filename: { type: String, required: true },
        oldPath: { type: String, default: "" },
        newPath: { type: String, default: "" },
        chunks: [
          {
            header: { type: String, default: "" },
            lines: [
              {
                type: { type: String, enum: ["add", "del", "normal"], default: "normal" },
                oldLine: { type: Number },
                newLine: { type: Number },
                content: { type: String, default: "" },
              },
            ],
          },
        ],
      },
    ],
    aiReview: {
      score: { type: Number },
      securityStatus: { type: String, enum: ["PASSED", "WARNING", "CRITICAL"] },
      performanceImpact: { type: String },
      summary: { type: String },
      findings: [
        {
          id: { type: String },
          type: { type: String, enum: ["security", "performance", "suggestion"] },
          filename: { type: String },
          lineNumber: { type: Number },
          title: { type: String },
          message: { type: String },
          suggestion: { type: String },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

PullRequestSchema.index({ organizationId: 1, number: -1 });

export const PullRequestModel =
  mongoose.models.PullRequest ||
  mongoose.model<IPullRequestDoc>("PullRequest", PullRequestSchema);
