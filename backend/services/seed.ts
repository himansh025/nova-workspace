import { WorkspaceDB } from "./types";

export const initialWorkspaceDB: WorkspaceDB = {
  projects: [
    {
      id: "prj-1",
      name: "Platform Core 2.0",
      slug: "platform-core",
      description: "High-performance distributed telemetry, state sync, and real-time computation engine.",
      sprint: "Sprint 48",
      progressPercent: 84,
      cycleTime: "1.4d",
      velocity: "+24% vs avg",
      activeBranch: "main@4f81c9a",
      repository: "github.com/nova-arch/platform-core",
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-09-13T18:30:00Z"
    },
    {
      id: "prj-2",
      name: "Edge Compute Gateway",
      slug: "edge-gateway",
      description: "Global low-latency edge routing layer with sub-10ms TTFB and automated SSL offloading.",
      sprint: "Sprint 12",
      progressPercent: 62,
      cycleTime: "1.1d",
      velocity: "+18% vs avg",
      activeBranch: "main@b72a09c",
      repository: "github.com/nova-arch/edge-gateway",
      createdAt: "2026-08-15T09:00:00Z",
      updatedAt: "2026-09-12T14:15:00Z"
    },
    {
      id: "prj-3",
      name: "Auth & Identity Service 3.0",
      slug: "auth-service",
      description: "Zero-trust identity mesh, OAuth 2.1 PKCE server, and granular RBAC authorization engine.",
      sprint: "Sprint 29",
      progressPercent: 45,
      cycleTime: "2.3d",
      velocity: "+9% vs avg",
      activeBranch: "feat/oauth-v3@c193ab2",
      repository: "github.com/nova-arch/auth-service",
      createdAt: "2026-08-20T11:30:00Z",
      updatedAt: "2026-09-13T12:00:00Z"
    }
  ],
  team: [
    {
      id: "usr-1",
      name: "Elena Rostova",
      email: "elena@nova.dev",
      role: "Lead Architect",
      avatar: "",
      initials: "ER",
      status: "online",
      activeTasksCount: 3
    },
    {
      id: "usr-2",
      name: "Marcus Chen",
      email: "marcus@nova.dev",
      role: "Staff Frontend Engineer",
      avatar: "",
      initials: "MC",
      status: "online",
      activeTasksCount: 2
    },
    {
      id: "usr-3",
      name: "Siddharth N.",
      email: "siddharth@nova.dev",
      role: "Distributed Systems Lead",
      avatar: "",
      initials: "SN",
      status: "away",
      activeTasksCount: 3
    },
    {
      id: "usr-4",
      name: "Devon Vance",
      email: "devon@nova.dev",
      role: "Graphics & Realtime Specialist",
      avatar: "",
      initials: "DV",
      status: "online",
      activeTasksCount: 2
    },
    {
      id: "usr-5",
      name: "Aaliyah Patel",
      email: "aaliyah@nova.dev",
      role: "Security & Compliance Lead",
      avatar: "",
      initials: "AP",
      status: "offline",
      activeTasksCount: 2
    }
  ],
  tasks: [
    {
      id: "tsk-1",
      key: "NV-842",
      projectId: "prj-1",
      title: "Stream zero-copy binary parser for telemetry events",
      description: "Implement zero-copy memory buffers using WebAssembly memory allocation to parse 100k incoming events/sec without garbage collector pauses.",
      status: "in_progress",
      priority: "urgent",
      assignee: {
        id: "usr-1",
        name: "Elena Rostova",
        avatar: "",
        initials: "ER"
      },
      tags: ["Performance", "Core", "Telemetry"],
      branch: "feat/binary-parser",
      estimate: "3 pts",
      createdAt: "2026-09-10T08:30:00Z",
      updatedAt: "2026-09-13T16:20:00Z"
    },
    {
      id: "tsk-2",
      key: "NV-847",
      projectId: "prj-1",
      title: "Implement optimistic offline mutations in sync engine",
      description: "Persist mutation queues in IndexedDB with deterministic conflict resolution clocks to guarantee reconciliation upon reconnect.",
      status: "review",
      priority: "high",
      assignee: {
        id: "usr-2",
        name: "Marcus Chen",
        avatar: "",
        initials: "MC"
      },
      tags: ["State", "Client", "CRDT"],
      branch: "fix/offline-sync",
      estimate: "5 pts",
      createdAt: "2026-09-11T10:15:00Z",
      updatedAt: "2026-09-13T14:40:00Z"
    },
    {
      id: "tsk-3",
      key: "NV-851",
      projectId: "prj-1",
      title: "Consolidate edge compute middleware headers",
      description: "Standardize request context propagation, trace IDs, and geo-ip headers across all V8 edge runtime worker delegates.",
      status: "done",
      priority: "medium",
      assignee: {
        id: "usr-3",
        name: "Siddharth N.",
        avatar: "",
        initials: "SN"
      },
      tags: ["Infra", "Edge"],
      branch: "infra/edge-headers",
      estimate: "2 pts",
      createdAt: "2026-09-09T14:00:00Z",
      updatedAt: "2026-09-12T19:10:00Z"
    },
    {
      id: "tsk-4",
      key: "NV-859",
      projectId: "prj-1",
      title: "Audit WebGL shader memory allocations on unmount",
      description: "Clean up orphan GPU buffers and texture handles when switching views to prevent memory leaks during extended browser sessions.",
      status: "backlog",
      priority: "high",
      assignee: {
        id: "usr-4",
        name: "Devon Vance",
        avatar: "",
        initials: "DV"
      },
      tags: ["Graphics", "Bug"],
      estimate: "3 pts",
      createdAt: "2026-09-12T11:00:00Z",
      updatedAt: "2026-09-12T11:00:00Z"
    },
    {
      id: "tsk-5",
      key: "NV-860",
      projectId: "prj-1",
      title: "Mitigate connection pool exhaustion under sudden traffic spikes",
      description: "Introduce adaptive queuing and backpressure shed algorithms in the connection multiplexer to avoid Postgres pool saturation.",
      status: "in_progress",
      priority: "urgent",
      assignee: {
        id: "usr-3",
        name: "Siddharth N.",
        avatar: "",
        initials: "SN"
      },
      tags: ["Database", "Reliability"],
      branch: "fix/conn-pool-queue",
      estimate: "5 pts",
      createdAt: "2026-09-12T15:20:00Z",
      updatedAt: "2026-09-13T17:05:00Z"
    },
    {
      id: "tsk-6",
      key: "NV-862",
      projectId: "prj-1",
      title: "Enforce strict CSP & Subresource Integrity policy across micro-frontends",
      description: "Generate dynamic cryptographic nonces for inline script execution and enforce sha384 subresource hashes on external assets.",
      status: "review",
      priority: "high",
      assignee: {
        id: "usr-5",
        name: "Aaliyah Patel",
        avatar: "",
        initials: "AP"
      },
      tags: ["Security", "Compliance"],
      branch: "security/csp-sri",
      estimate: "3 pts",
      createdAt: "2026-09-11T13:40:00Z",
      updatedAt: "2026-09-13T11:20:00Z"
    },
    {
      id: "tsk-7",
      key: "NV-865",
      projectId: "prj-1",
      title: "Differential CRDT state delta compaction engine",
      description: "Compress historical operation logs into snapshot states when operation sequence exceeds 10,000 steps.",
      status: "backlog",
      priority: "medium",
      assignee: {
        id: "usr-1",
        name: "Elena Rostova",
        avatar: "",
        initials: "ER"
      },
      tags: ["CRDT", "Storage"],
      estimate: "8 pts",
      createdAt: "2026-09-13T09:00:00Z",
      updatedAt: "2026-09-13T09:00:00Z"
    },
    {
      id: "tsk-8",
      key: "NV-868",
      projectId: "prj-1",
      title: "Virtualized tree renderer for 50,000+ dependency nodes",
      description: "Build windowed DOM rendering for large multi-repo AST hierarchies to keep frame rate pinned at 60fps.",
      status: "backlog",
      priority: "low",
      assignee: {
        id: "usr-2",
        name: "Marcus Chen",
        avatar: "",
        initials: "MC"
      },
      tags: ["UI", "Optimization"],
      estimate: "3 pts",
      createdAt: "2026-09-13T10:15:00Z",
      updatedAt: "2026-09-13T10:15:00Z"
    },
    {
      id: "tsk-9",
      key: "NV-870",
      projectId: "prj-1",
      title: "Webhook delivery exponential backoff with dead-letter queue",
      description: "Implement reliable retry semantics with jitter and dead-letter archiving for third-party HTTP callback subscribers.",
      status: "done",
      priority: "high",
      assignee: {
        id: "usr-3",
        name: "Siddharth N.",
        avatar: "",
        initials: "SN"
      },
      tags: ["Webhooks", "Queues"],
      branch: "feat/webhook-retry",
      estimate: "5 pts",
      createdAt: "2026-09-08T11:00:00Z",
      updatedAt: "2026-09-11T16:00:00Z"
    },
    {
      id: "tsk-10",
      key: "NV-873",
      projectId: "prj-1",
      title: "Multi-tenant token isolation check in JWT verifier",
      description: "Verify audience claims and tenant organization bindings on every cryptographic token decode to prevent cross-tenant leakage.",
      status: "done",
      priority: "urgent",
      assignee: {
        id: "usr-5",
        name: "Aaliyah Patel",
        avatar: "",
        initials: "AP"
      },
      tags: ["Security", "Auth"],
      branch: "sec/jwt-isolation",
      estimate: "2 pts",
      createdAt: "2026-09-09T09:30:00Z",
      updatedAt: "2026-09-10T15:45:00Z"
    }
  ],
  specs: [
    {
      id: "spec-1",
      key: "SPEC-104",
      projectId: "prj-1",
      title: "Real-time collaborative CRDT state sync protocol",
      summary: "Sub-50ms peer state propagation with deterministic vector clocks and conflict-free delta reconciliation.",
      content: `## Architecture Specification: CRDT State Sync Protocol

### 1. Context & Motivation
Engineering teams need instant, sub-50ms collaborative updates across concurrent sessions without locking documents or experiencing merge anomalies.

### 2. Protocol Design
- **State Primitive**: State-based Delta-CRDT with Lamport timestamps.
- **Transport**: WebSocket bidirectional streaming over binary protocol buffer framing.
- **Storage Strategy**: Local SQLite/IndexedDB journal caching with background cloud sync.

### 3. Verification Criteria
- p99 round-trip latency under 45ms across 1,000 concurrent active users.
- Deterministic convergence in chaotic network partitions.
- Zero data loss on abrupt client termination.`,
      status: "approved",
      author: {
        id: "usr-1",
        name: "Elena Rostova",
        initials: "ER"
      },
      tags: ["CRDT", "Distributed", "Approved"],
      createdAt: "2026-09-02T10:00:00Z",
      updatedAt: "2026-09-08T14:30:00Z"
    },
    {
      id: "spec-2",
      key: "SPEC-105",
      projectId: "prj-1",
      title: "Edge vector search schema for contextual AI reasoning",
      summary: "Continuous multi-repo git commit & pull request semantic embeddings indexed directly on edge nodes.",
      content: `## Architecture Specification: Edge Vector Search

### 1. Problem Definition
The Nova AI Context Engine requires instant semantic search over git commit logs, PR reviews, task trees, and architecture specs without incurring round-trip latency to central clusters.

### 2. Storage & Model Architecture
- **Embedding Model**: Text-embedding-3-small (1536 dims) quantized to 8-bit integers.
- **Index Engine**: Hierarchical Navigable Small World (HNSW) graph on edge memory.
- **Cache Invalidation**: Webhook push notifications from GitHub/GitLab trigger incremental delta updates.

### 3. Open Discussion Points
- Need consensus on vector memory cache limit per active workspace (proposing 256MB).
- Reviewing schema for AST node linking.`,
      status: "review",
      author: {
        id: "usr-4",
        name: "Devon Vance",
        initials: "DV"
      },
      tags: ["AI", "Vector", "In-Review"],
      createdAt: "2026-09-05T12:00:00Z",
      updatedAt: "2026-09-12T17:10:00Z"
    },
    {
      id: "spec-3",
      key: "SPEC-106",
      projectId: "prj-1",
      title: "Zero-downtime database migration strategy",
      summary: "Dual-write shadow pipeline for customer authentication and workspace tenant tables.",
      content: `## Architecture Specification: Zero-Downtime Migration

### 1. Executive Summary
This document establishes the four-phase migration framework for updating schema definitions in high-volume production tables without locks.

### 2. Migration Phases
1. **Expand**: Add new nullable columns and dual-write triggers.
2. **Backfill**: Asynchronous worker pool migrates legacy rows in chunks of 5,000.
3. **Switch Read**: Direct primary read paths to the new schema with automatic fallback.
4. **Contract**: Safely drop deprecated columns once traffic stabilizes over 72 hours.

### 3. Rollback Playbook
If write latency p99 exceeds 35ms during Phase 2, automated circuit breakers pause the backfill and disable shadow triggers immediately.`,
      status: "approved",
      author: {
        id: "usr-3",
        name: "Siddharth N.",
        initials: "SN"
      },
      tags: ["Database", "Migration", "Approved"],
      createdAt: "2026-09-01T09:00:00Z",
      updatedAt: "2026-09-07T11:00:00Z"
    }
  ],
  releases: [
    {
      id: "rel-1",
      version: "v2.4.0-production",
      projectId: "prj-1",
      status: "canary",
      canaryPercentage: 25,
      checksPassed: 5,
      totalChecks: 5,
      checks: [
        {
          id: "chk-1",
          name: "Unit & Integration Test Suite",
          category: "test",
          status: "passed",
          duration: "342ms",
          details: "482 tests passed across 34 suites with 98.4% statement coverage"
        },
        {
          id: "chk-2",
          name: "Static AST Security & CVE Audit",
          category: "security",
          status: "passed",
          duration: "180ms",
          details: "0 critical, 0 high vulnerabilities detected. All package licenses compliant"
        },
        {
          id: "chk-3",
          name: "Schema Migration Shadow Dry-Run",
          category: "database",
          status: "passed",
          duration: "520ms",
          details: "Dual-write simulation executed against staging cluster with 0 write conflicts"
        },
        {
          id: "chk-4",
          name: "Minimal Container Build & Digest Verification",
          category: "build",
          status: "passed",
          duration: "890ms",
          details: "Docker image digest sha256:7f42c1... signed with Cosign key"
        },
        {
          id: "chk-5",
          name: "E2E Distributed Smoke Simulation",
          category: "e2e",
          status: "passed",
          duration: "1240ms",
          details: "Synthetic client journeys completed across 6 global AWS/Cloudflare regions"
        }
      ],
      changelog: [
        "Feature: Universal command palette with sub-50ms fuzzy search and keyboard shortcuts",
        "Enhancement: Contextual AI engine directly cross-references live project tasks and specs",
        "Fix: Resolved memory leak during long-lived WebSocket sessions",
        "Perf: Consolidated edge compute middleware headers eliminating 14ms latency",
        "Security: Added JWT multi-tenant claim isolation verification in auth gateway"
      ],
      createdAt: "2026-09-12T16:00:00Z",
      updatedAt: "2026-09-13T17:45:00Z"
    }
  ],
  activities: [
    {
      id: "act-1",
      type: "release",
      actor: { name: "Devon Vance", initials: "DV" },
      action: "promoted canary traffic to 25%",
      target: "v2.4.0-production",
      timestamp: "10m ago"
    },
    {
      id: "act-2",
      type: "task_status",
      actor: { name: "Elena Rostova", initials: "ER" },
      action: "started working on",
      target: "NV-842 (Zero-copy binary parser)",
      timestamp: "32m ago"
    },
    {
      id: "act-3",
      type: "commit",
      actor: { name: "Marcus Chen", initials: "MC" },
      action: "pushed commit 7b23f1e to",
      target: "fix/offline-sync",
      timestamp: "1h ago"
    },
    {
      id: "act-4",
      type: "spec_approved",
      actor: { name: "Elena Rostova", initials: "ER" },
      action: "approved architecture spec",
      target: "SPEC-104 (CRDT State Sync)",
      timestamp: "2h ago"
    },
    {
      id: "act-5",
      type: "task_status",
      actor: { name: "Siddharth N.", initials: "SN" },
      action: "moved to Done",
      target: "NV-851 (Edge compute middleware headers)",
      timestamp: "4h ago"
    }
  ],
  settings: {
    workspaceName: "Nova Engineering Labs",
    slug: "nova-core",
    defaultBranch: "main",
    githubConnected: true,
    gitlabConnected: false,
    linearSync: true,
    autoAssignReviewers: true
  }
};
