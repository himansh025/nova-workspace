export interface IntegrationItem {
  id: string;
  name: string;
  category: "Source Control" | "Design" | "Knowledge" | "Communication" | "Cloud & CI" | "Observability";
  description: string;
  iconName: string;
  badge: string;
}

export const integrationsList: IntegrationItem[] = [
  {
    id: "git",
    name: "Git Engine",
    category: "Source Control",
    description: "Automatic branch generation, commit linking, and pull request state sync for GitHub, GitLab, and Bitbucket.",
    iconName: "GitBranch",
    badge: "Native Sync"
  },
  {
    id: "design",
    name: "Design Systems",
    category: "Design",
    description: "Embed live Figma component frames, design specs, and color tokens directly inside engineering tickets.",
    iconName: "Figma",
    badge: "Live Embed"
  },
  {
    id: "docs",
    name: "Docs & Specs",
    category: "Knowledge",
    description: "Markdown specs with live telemetry widgets, OpenAPI schema rendering, and zero-latency collaborative editing.",
    iconName: "FileText",
    badge: "Markdown"
  },
  {
    id: "slack",
    name: "Team Slack",
    category: "Communication",
    description: "Interactive issue triage, AI summary digests, and instant thread creation right from Slack notifications.",
    iconName: "MessageSquare",
    badge: "Bidirectional"
  },
  {
    id: "cloud",
    name: "Cloud & CI/CD",
    category: "Cloud & CI",
    description: "Connect GitHub Actions, CircleCI, Vercel, and AWS to verify canary rollouts and preview environments.",
    iconName: "Cloud",
    badge: "Automated"
  },
  {
    id: "analytics",
    name: "Observability",
    category: "Observability",
    description: "Correlate Sentry exceptions, Datadog alerts, and performance degradations directly with released pull requests.",
    iconName: "BarChart3",
    badge: "Telemetry"
  }
];
