import mongoose, { Schema, Document } from "mongoose";

export interface IServiceNodeDoc extends Document {
  id: string;
  organizationId: string;
  environment: "prod" | "canary" | "staging";
  name: string;
  type: "edge" | "service" | "database" | "cache" | "ai";
  runtime: string;
  version: string;
  region: string;
  endpointUrl?: string;
  status: "healthy" | "degraded" | "maintenance";
  p99Latency: string;
  requestsPerSec: string;
  errorRate: string;
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  dependencies: string[];
  dependents: string[];
  linkedTasks: string[];
  x: number;
  y: number;
  lastProbedAt?: string;
}

const ServiceNodeSchema = new Schema<IServiceNodeDoc>(
  {
    id: { type: String, required: true },
    organizationId: { type: String, required: true, index: true },
    environment: {
      type: String,
      enum: ["prod", "canary", "staging"],
      default: "prod",
      index: true,
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["edge", "service", "database", "cache", "ai"],
      required: true,
    },
    runtime: { type: String, required: true },
    version: { type: String, default: "v1.0.0" },
    region: { type: String, default: "us-east-1" },
    endpointUrl: { type: String },
    status: {
      type: String,
      enum: ["healthy", "degraded", "maintenance"],
      default: "healthy",
    },
    p99Latency: { type: String, default: "5.0ms" },
    requestsPerSec: { type: String, default: "1.0k req/s" },
    errorRate: { type: String, default: "0.000%" },
    uptime: { type: String, default: "99.99%" },
    cpuUsage: { type: Number, default: 20 },
    memoryUsage: { type: Number, default: 30 },
    activeConnections: { type: Number, default: 100 },
    dependencies: [{ type: String }],
    dependents: [{ type: String }],
    linkedTasks: [{ type: String }],
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    lastProbedAt: { type: String },
  },
  {
    timestamps: true,
  }
);

ServiceNodeSchema.index({ organizationId: 1, environment: 1, id: 1 }, { unique: true });

export const ServiceNodeModel =
  mongoose.models.ServiceNode ||
  mongoose.model<IServiceNodeDoc>("ServiceNode", ServiceNodeSchema);
