export interface TaskItem {
  id: string;
  key: string;
  title: string;
  status: "backlog" | "in_progress" | "review" | "done";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: {
    name: string;
    avatar: string;
    initials: string;
  };
  tags: string[];
  branch?: string;
  estimate?: string;
}

export interface AiPromptOption {
  id: string;
  label: string;
  prompt: string;
  response: {
    summary: string;
    bullets: string[];
    actionRequired?: string;
    codeSnippet?: string;
  };
}

export interface MetricDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export const heroMockData = {
  project: {
    name: "Platform Core 2.0",
    sprint: "Sprint 48",
    progressPercent: 78,
    cycleTime: "1.4d",
    velocity: "+24% vs avg",
    activeBranch: "main@4f81c9a"
  },
  sidebarNav: [
    { id: "overview", label: "Overview", icon: "LayoutDashboard", active: false },
    { id: "projects", label: "Projects", icon: "FolderKanban", active: false, count: 8 },
    { id: "tasks", label: "Tasks", icon: "CheckSquare", active: true, count: 14 },
    { id: "ai", label: "AI Copilot", icon: "Sparkles", active: false, badge: "Context Live" },
    { id: "insights", label: "Insights", icon: "TrendingUp", active: false },
    { id: "team", label: "Team", icon: "Users", active: false, count: 12 },
    { id: "settings", label: "Settings", icon: "Settings", active: false }
  ],
  tasks: [
    {
      id: "tsk-1",
      key: "NV-842",
      title: "Stream zero-copy binary parser for telemetry events",
      status: "in_progress",
      priority: "urgent",
      assignee: { name: "Elena Rostova", avatar: "", initials: "ER" },
      tags: ["Performance", "Core"],
      branch: "feat/binary-parser",
      estimate: "3 pts"
    },
    {
      id: "tsk-2",
      key: "NV-847",
      title: "Implement optimistic offline mutations in sync engine",
      status: "review",
      priority: "high",
      assignee: { name: "Marcus Chen", avatar: "", initials: "MC" },
      tags: ["State", "Client"],
      branch: "fix/offline-sync",
      estimate: "5 pts"
    },
    {
      id: "tsk-3",
      key: "NV-851",
      title: "Consolidate edge compute middleware headers",
      status: "done",
      priority: "medium",
      assignee: { name: "Siddharth N.", avatar: "", initials: "SN" },
      tags: ["Infra"],
      branch: "infra/edge-headers",
      estimate: "2 pts"
    },
    {
      id: "tsk-4",
      key: "NV-859",
      title: "Audit WebGL shader memory allocations on unmount",
      status: "backlog",
      priority: "high",
      assignee: { name: "Devon V.", avatar: "", initials: "DV" },
      tags: ["Graphics", "Bug"],
      estimate: "3 pts"
    }
  ] as TaskItem[],
  aiAssistant: {
    query: "Summarize this project",
    thinking: "Analyzing 42 commits, 14 issues, and 3 open pull requests across 4 repositories...",
    response: "Three blockers are slowing the release cycle. Pipeline latency resolved; 4 tasks awaiting PR review in auth service. Velocity is tracking 18% ahead of baseline.",
    blockers: [
      "PR #184 awaiting secondary review on database schema migration",
      "Memory leak observed in WebGL canvas viewport resize loop",
      "Staging cluster SSL cert renewal pending DNS validation"
    ],
    nextSteps: "Merge PR #184 to unblock QA automation suite for Release 2.4.0."
  }
};

export const interactiveAiPrompts: AiPromptOption[] = [
  {
    id: "summarize",
    label: "Summarize this project",
    prompt: "Summarize current milestone status, recent merges, and delivery velocity.",
    response: {
      summary: "Sprint 48 is 84% complete. 28 issues closed across 6 PRs. Overall cycle time reduced to 1.4 days.",
      bullets: [
        "Core telemetry engine merged with 0 regression alerts",
        "Edge caching warm-up verified in staging cluster (p99: 14ms)",
        "Documentation and changelog ready for customer distribution"
      ],
      actionRequired: "Final approval on PR #204 will initiate production canary rollout."
    }
  },
  {
    id: "find-blockers",
    label: "Find blockers",
    prompt: "Scan open issues, dependencies, and PR comments for release blockers.",
    response: {
      summary: "Detected 2 critical bottlenecks across cross-team dependencies:",
      bullets: [
        "NV-832: Authentication token refresh deadlock under peak load (Assignee: Elena)",
        "NV-844: WebGL context recreation memory allocation spike on Safari Mobile"
      ],
      actionRequired: "Elena pushed patch commit `7b23f1e`. Running isolated stress test now."
    }
  },
  {
    id: "draft-release",
    label: "Draft a release update",
    prompt: "Draft an engineer-facing changelog for NOVA Workspace v2.4.0.",
    response: {
      summary: "NOVA Workspace v2.4.0 Release Notes (Automated Draft):",
      bullets: [
        "Feature: Sub-50ms universal command palette with keyboard jump targets",
        "Enhancement: Contextual AI reasoning now indexes multi-repo schemas",
        "Fix: Resolved memory leak during long-lived websocket sessions"
      ],
      actionRequired: "Ready to push to internal Changelog and public release feed."
    }
  },
  {
    id: "group-issues",
    label: "Group related issues",
    prompt: "Cluster unresolved bug reports by shared root cause or affected service.",
    response: {
      summary: "Synthesized 9 open issues into 2 distinct root clusters:",
      bullets: [
        "Cluster A (5 issues): WebSocket reconnection backoff retry loop in poor connectivity",
        "Cluster B (4 issues): GraphQL schema type generation mismatch in custom field hooks"
      ],
      actionRequired: "Applying batch label `service:websocket-gateway` and reassigned to Network Squad."
    }
  }
];

export const productStoryStages = [
  {
    id: "plan",
    step: "01",
    tab: "PLAN",
    title: "Plan with mathematical clarity.",
    description: "Write specs that link directly to executable issues, git branches, and engineering roadmaps. Eliminate ambiguity before code is committed.",
    badge: "SPECIFICATION ENGINE",
    mockItems: [
      { code: "SPEC-104", title: "Real-time collaborative CRDT state sync protocol", state: "Approved" },
      { code: "SPEC-105", title: "Edge vector search schema for contextual AI", state: "In Review" },
      { code: "SPEC-106", title: "Zero-downtime database migration strategy", state: "Drafting" }
    ]
  },
  {
    id: "build",
    step: "02",
    tab: "BUILD",
    title: "High-velocity issue execution.",
    description: "Built for engineers who live on their keyboard. Fluid Kanban columns, instant branch creation, and automated status shifts on git push.",
    badge: "EXECUTION KANBAN",
    columns: ["Backlog", "In Progress", "Review", "Done"]
  },
  {
    id: "ai",
    step: "03",
    tab: "AI",
    title: "Context-aware intelligence.",
    description: "An AI copilot that doesn't just autocomplete code—it understands your entire repository graph, open pull requests, and product dependencies.",
    badge: "CONTEXT ENGINE",
    sampleQuery: "Identify potential regressions in the payment pipeline",
    sampleOutput: "Analysis of 18 files reveals 2 unhandled edge cases in stripe-webhook-handler.ts."
  },
  {
    id: "insights",
    step: "04",
    tab: "INSIGHTS",
    title: "Real-time engineering signals.",
    description: "No manual status surveys or bloated meetings. NOVA continuously computes cycle time, review latency, and deployment velocity.",
    badge: "TELEMETRY DASHBOARD",
    metrics: [
      { label: "Cycle Time", value: "1.4d", delta: "-42% reduction" },
      { label: "Throughput", value: "48 tasks/sprint", delta: "+28% increase" },
      { label: "Review Latency", value: "2.1 hrs", delta: "Sub-3hr SLA met" }
    ]
  },
  {
    id: "ship",
    step: "05",
    tab: "SHIP",
    title: "One-click confident release.",
    description: "Automated pre-flight checks, canary distribution monitoring, and generated release announcements. Ship without fear.",
    badge: "RELEASE AUTOMATION",
    releaseVersion: "v2.4.0-production",
    checksPassed: 14,
    totalChecks: 14
  }
];

export const analyticsChartData: MetricDataPoint[] = [
  { label: "Mon", value: 24, secondaryValue: 18 },
  { label: "Tue", value: 38, secondaryValue: 26 },
  { label: "Wed", value: 32, secondaryValue: 30 },
  { label: "Thu", value: 52, secondaryValue: 34 },
  { label: "Fri", value: 68, secondaryValue: 45 },
  { label: "Sat", value: 42, secondaryValue: 48 },
  { label: "Sun", value: 74, secondaryValue: 56 }
];
