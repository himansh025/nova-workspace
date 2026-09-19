export const analyticsMetrics = [
  { label: "Cycle Time", value: "1.4d", delta: "-38% this cycle", positive: true },
  { label: "Deployment Velocity", value: "32/wk", delta: "+4.2x from Q2", positive: true },
  { label: "Resolved Blockers", value: "98.2%", delta: "+12% faster triage", positive: true },
  { label: "Review Latency", value: "2.8h", delta: "-55% wait time", positive: true },
];

export const workflowSteps = [
  {
    number: "01",
    title: "CAPTURE",
    description: "Record bugs, requests, and feature explorations instantly with global hotkeys and CLI commands.",
    details: ["Global command palette", "CLI capture tool", "Automated duplicate detection"],
  },
  {
    number: "02",
    title: "PLAN",
    description: "Group tasks into milestones, link specs, and set engineering constraints with zero spreadsheet drag.",
    details: ["Milestone burn-down graphs", "Cross-team dependencies", "Automated capacity forecasting"],
  },
  {
    number: "03",
    title: "BUILD",
    description: "Engineers stay in their flow state with fast keyboard-driven triage, git auto-closing, and dark mode UI.",
    details: ["Git branch automation", "Instant issue transitions", "PR health checks"],
  },
  {
    number: "04",
    title: "SHIP",
    description: "Trigger releases, verify staging health, and automatically notify stakeholders with generated notes.",
    details: ["Canary verification", "Automated changelogs", "Customer release alerts"],
  },
];

export const caseStudyData = {
  tag: "CASE STUDY",
  client: "Northstar Engineering",
  headline: "How Northstar reduced product handoff friction by 64%.",
  description: "Northstar scaled from 12 to 85 engineers while maintaining sub-2 day cycle times using NOVA Workspace's unified context engine.",
  metrics: [
    { label: "Sprint Cycle Time", value: "-42%", change: "reduced from 3.8 days to 1.4 days" },
    { label: "Cross-Team Syncs", value: "3.8x", change: "faster resolution of shared blockers" },
    { label: "Release Predictability", value: "99.4%", change: "on-time scheduled deployment rate" },
  ],
};

export const securityPillars = [
  {
    title: "End-to-End Workspace Encryption",
    description: "All project specs, discussion threads, and AI contextual embeddings are encrypted in transit and at rest.",
    tags: ["TLS 1.3", "AES-256-GCM", "Zero-Knowledge Enclaves"],
  },
  {
    title: "Granular Role-Based Permissions",
    description: "Fine-grained ACLs scoping access down to single repositories, projects, or individual documents.",
    tags: ["Custom Roles", "SAML SSO", "SCIM Provisioning"],
  },
  {
    title: "Immutable Audit Logs",
    description: "Every issue transition, API call, and permission change is recorded in tamper-evident logs.",
    tags: ["Real-time SIEM Export", "Cryptographic Hashing", "Retention Policies"],
  },
  {
    title: "Isolated AI Processing",
    description: "Your code and private context never train public foundation models or leave your deployment perimeter.",
    tags: ["Tenant Isolation", "No Model Training", "Private VPC Available"],
  },
];
