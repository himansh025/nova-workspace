export interface ServiceNode {
  id: string;
  name: string;
  type: "edge" | "service" | "database" | "cache" | "ai";
  runtime: string;
  version: string;
  region: string;
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
}

export const INITIAL_SERVICE_NODES: ServiceNode[] = [
  {
    id: "node-edge",
    name: "Edge Compute Gateway",
    type: "edge",
    runtime: "Cloudflare V8 Workers",
    version: "v2.4.0-canary",
    region: "Global Anycast (280+ PoPs)",
    status: "healthy",
    p99Latency: "8.2ms",
    requestsPerSec: "24.8k req/s",
    errorRate: "0.002%",
    uptime: "99.995%",
    cpuUsage: 28,
    memoryUsage: 34,
    activeConnections: 14200,
    dependencies: ["node-auth", "node-core"],
    dependents: [],
    linkedTasks: ["NV-851: Consolidate edge middleware headers"],
    x: 20,
    y: 40,
  },
  {
    id: "node-auth",
    name: "Auth & Identity Mesh",
    type: "service",
    runtime: "Rust / Actix-Web",
    version: "v3.1.2",
    region: "us-east-1 / eu-central-1",
    status: "healthy",
    p99Latency: "2.4ms",
    requestsPerSec: "8.4k req/s",
    errorRate: "0.000%",
    uptime: "99.999%",
    cpuUsage: 19,
    memoryUsage: 22,
    activeConnections: 4800,
    dependencies: ["node-db"],
    dependents: ["node-edge"],
    linkedTasks: ["NV-873: Multi-tenant token isolation check"],
    x: 50,
    y: 15,
  },
  {
    id: "node-core",
    name: "Platform Core API Engine",
    type: "service",
    runtime: "Node.js 20 / Express + CRDT",
    version: "v2.4.0-rc1",
    region: "us-east-1",
    status: "healthy",
    p99Latency: "6.8ms",
    requestsPerSec: "16.2k req/s",
    errorRate: "0.012%",
    uptime: "99.98%",
    cpuUsage: 54,
    memoryUsage: 61,
    activeConnections: 9200,
    dependencies: ["node-cache", "node-db", "node-ai"],
    dependents: ["node-edge"],
    linkedTasks: ["NV-842: Zero-copy binary parser", "NV-860: Connection pool exhaustion"],
    x: 50,
    y: 65,
  },
  {
    id: "node-ai",
    name: "Vector & AI Context Store",
    type: "ai",
    runtime: "Python / HNSW Index",
    version: "v1.8.0",
    region: "us-east-1 (GPU Node)",
    status: "healthy",
    p99Latency: "14.5ms",
    requestsPerSec: "1.2k req/s",
    errorRate: "0.005%",
    uptime: "99.94%",
    cpuUsage: 68,
    memoryUsage: 74,
    activeConnections: 350,
    dependencies: [],
    dependents: ["node-core"],
    linkedTasks: ["SPEC-105: Edge vector search schema"],
    x: 80,
    y: 15,
  },
  {
    id: "node-cache",
    name: "Redis CRDT State Pool",
    type: "cache",
    runtime: "Redis 7.2 Cluster",
    version: "v7.2.4",
    region: "us-east-1 (Multi-AZ)",
    status: "healthy",
    p99Latency: "0.8ms",
    requestsPerSec: "42.0k req/s",
    errorRate: "0.000%",
    uptime: "99.999%",
    cpuUsage: 14,
    memoryUsage: 48,
    activeConnections: 6400,
    dependencies: [],
    dependents: ["node-core"],
    linkedTasks: ["NV-865: Differential CRDT state delta compaction"],
    x: 80,
    y: 50,
  },
  {
    id: "node-db",
    name: "PostgreSQL Primary Cluster",
    type: "database",
    runtime: "Postgres 16 / PgBouncer",
    version: "v16.2",
    region: "us-east-1 (Primary + 2 Read Replicas)",
    status: "healthy",
    p99Latency: "4.1ms",
    requestsPerSec: "9.8k req/s",
    errorRate: "0.001%",
    uptime: "99.99%",
    cpuUsage: 42,
    memoryUsage: 56,
    activeConnections: 380,
    dependencies: [],
    dependents: ["node-core", "node-auth"],
    linkedTasks: ["SPEC-106: Zero-downtime database migration"],
    x: 80,
    y: 85,
  },
];
