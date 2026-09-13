export interface FeatureItem {
  id: string;
  category: string;
  title: string;
  headline: string;
  description: string;
  highlights: string[];
  metric?: string;
  metricLabel?: string;
  icon: string;
}

export const featuresList: FeatureItem[] = [
  {
    id: "clarity-planning",
    category: "SPECIFICATIONS & ARCHITECTURE",
    title: "PLAN WITH CLARITY.",
    headline: "Transform high-level roadmap initiatives into atomic, executable engineering specs.",
    description: "Traditional specs rot in Google Docs or Notion. In NOVA, specifications are living documents bound directly to issues, schema migrations, and pull requests.",
    highlights: [
      "Bidirectional links between requirement docs and live code commits",
      "Interactive architecture diagrams rendered from source markdown",
      "Automated drift detection between specs and API schemas",
      "Sub-millisecond keyboard navigation between specs and sprint boards"
    ],
    metric: "64%",
    metricLabel: "Fewer requirement rework cycles",
    icon: "Compass"
  },
  {
    id: "context-ai",
    category: "CONTEXTUAL REASONING",
    title: "AI THAT KNOWS THE CONTEXT.",
    headline: "An autonomous copilot grounded in your private repositories, design files, and ticket history.",
    description: "Instead of generic chatbot answers, NOVA indexes your entire organizational dependency graph. Ask questions, discover hidden blockers, and generate release notes in seconds.",
    highlights: [
      "Zero-data-retention security guarantees with private VPC options",
      "Real-time indexing of Git commits, PR review threads, and Figma specs",
      "Automated blocker detection across multi-team dependencies",
      "Synthesizes changelogs and customer release communications automatically"
    ],
    metric: "3.8x",
    metricLabel: "Faster release triage & blocker resolution",
    icon: "BrainCircuit"
  },
  {
    id: "issue-workflow",
    category: "HIGH-VELOCITY EXECUTION",
    title: "FLOW AT THE SPEED OF THOUGHT.",
    headline: "A developer-first issue tracker that never gets in your way.",
    description: "Optimized for minimal latency. Every action has a single-key shortcut. Branch names, git commit templates, and pull request statuses update automatically as work progresses.",
    highlights: [
      "Sub-50ms local state updates with optimistic offline support",
      "Git branch creation and auto-close triggers on merge",
      "Custom board views: Kanban, List, Dependency Matrix, and Timeline",
      "Native CLI client for engineers who prefer the terminal"
    ],
    metric: "0 ms",
    metricLabel: "UI transition lag with local CRDT sync",
    icon: "Kanban"
  },
  {
    id: "telemetry-analytics",
    category: "ENGINEERING INTELLIGENCE",
    title: "SEE THE SIGNAL.",
    headline: "Continuous engineering telemetry without bloated spreadsheets or standup surveys.",
    description: "Automated calculation of DORA metrics, cycle time distributions, review turnaround, and PR size health. Identify team bottlenecks before they derail milestones.",
    highlights: [
      "Automatic cycle time breakdown: Coding, Review, QA, Deployment",
      "Bottleneck prediction powered by historical PR turnaround times",
      "PR size and review velocity distribution charts",
      "Exportable telemetry reports for engineering leadership"
    ],
    metric: "-42%",
    metricLabel: "Average reduction in sprint cycle time",
    icon: "Activity"
  }
];

export const developerSectionData = {
  title: "BUILT FOR MODERN TEAMS.",
  subtitle: "Extend NOVA with an open GraphQL API, high-throughput webhooks, and an official TypeScript SDK.",
  codeTabs: [
    {
      id: "sdk",
      label: "TypeScript SDK",
      language: "typescript",
      code: `import { NovaClient } from "@nova/sdk";

const nova = new NovaClient({
  apiKey: process.env.NOVA_API_KEY,
  workspace: "acme-engineering"
});

// Autonomous triage on newly opened pull request
const triage = await nova.ai.analyzePR({
  repository: "acme/payment-service",
  pullRequestId: 1482,
  options: { detectBlockers: true, checkSpecDrift: true }
});

console.log(\`Triage Score: \${triage.riskScore} | Blockers: \${triage.blockers.length}\`);`
    },
    {
      id: "graphql",
      label: "GraphQL API",
      language: "graphql",
      code: `query GetSprintVelocity($projectId: ID!) {
  project(id: $projectId) {
    name
    currentSprint {
      cycleTimeDays
      completedPoints
      blockers {
        key
        title
        blockedDurationHours
      }
    }
  }
}`
    },
    {
      id: "webhook",
      label: "Webhooks",
      language: "json",
      code: `{
  "event": "issue.status_changed",
  "timestamp": "2026-09-12T21:30:00Z",
  "data": {
    "issueId": "NV-842",
    "previousStatus": "in_progress",
    "newStatus": "review",
    "trigger": "git.pr_opened",
    "branch": "feat/binary-parser",
    "author": "elena.rostova@nova.sh"
  }
}`
    }
  ]
};
