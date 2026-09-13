/**
 * NOVA WORKSPACE — THEME SCHEMA
 * Structured schema definition for future Headless CMS and SaaS platform customization.
 * Allows custom branding, hero configurations, dynamic feature stories, pricing tiers, and FAQs.
 */

export interface ThemeSchema {
  global: {
    brandName: string;
    productName: string;
    tagline: string;
    logo: {
      type: "svg" | "text" | "image";
      svgContent?: string;
      imageUrl?: string;
      alt: string;
    };
    colors: {
      background: string;
      surface: string;
      foreground: string;
      accent: string;
      dark: string;
      border: string;
    };
    typography: {
      sansFontFamily: string;
      monoFontFamily: string;
      headingWeight: number;
    };
  };

  hero: {
    badge?: string;
    heading: string;
    headingHighlight?: string;
    subtitle: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
    productPreview: {
      defaultProjectTitle: string;
      defaultSprintStatus: string;
      activeAiPrompt: string;
      activeAiResponse: string;
    };
  };

  trustedBy: {
    heading: string;
    companies: Array<{
      name: string;
      symbol?: string;
    }>;
  };

  productStory: {
    headline: string;
    subtitle: string;
    steps: Array<{
      id: string;
      stepNumber: string;
      name: string;
      tagline: string;
      description: string;
      badge: string;
    }>;
  };

  features: {
    heading: string;
    description: string;
    items: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      iconName: string;
      previewType: "code" | "board" | "graph" | "ai-chat";
    }>;
  };

  aiFeature: {
    heading: string;
    subtitle: string;
    prompts: string[];
    capabilities: Array<{
      title: string;
      desc: string;
    }>;
  };

  analytics: {
    heading: string;
    subtitle: string;
    metrics: Array<{
      label: string;
      value: string;
      delta: string;
      positive: boolean;
    }>;
  };

  integrations: {
    heading: string;
    subtitle: string;
    tools: Array<{
      name: string;
      category: string;
      description: string;
      icon: string;
    }>;
  };

  workflow: {
    heading: string;
    steps: Array<{
      number: string;
      title: string;
      description: string;
      details: string[];
    }>;
  };

  caseStudy: {
    tag: string;
    client: string;
    headline: string;
    description: string;
    metrics: Array<{
      label: string;
      value: string;
      change: string;
    }>;
  };

  security: {
    heading: string;
    subtitle: string;
    pillars: Array<{
      title: string;
      description: string;
      tags: string[];
    }>;
  };

  pricing: {
    heading: string;
    subtitle: string;
    billingIntervals: ("monthly" | "yearly")[];
    plans: Array<{
      id: string;
      name: string;
      priceMonthly: number;
      priceYearly: number;
      description: string;
      highlighted?: boolean;
      features: string[];
      ctaLabel: string;
      ctaHref: string;
    }>;
  };

  faq: {
    heading: string;
    subtitle: string;
    questions: Array<{
      question: string;
      answer: string;
      category?: string;
    }>;
  };

  finalCta: {
    heading: string;
    subtitle: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };

  footer: {
    columns: Array<{
      title: string;
      links: Array<{
        label: string;
        href: string;
      }>;
    }>;
    copyright: string;
  };
}

export const defaultThemeSchema: ThemeSchema = {
  global: {
    brandName: "NOVA",
    productName: "NOVA WORKSPACE",
    tagline: "TURN IDEAS INTO MOMENTUM.",
    logo: {
      type: "svg",
      alt: "NOVA Workspace"
    },
    colors: {
      background: "#FBFBFC",
      surface: "#FFFFFF",
      foreground: "#0E1013",
      accent: "#5E43F3",
      dark: "#0B0C0E",
      border: "#E5E7EB"
    },
    typography: {
      sansFontFamily: "Inter, sans-serif",
      monoFontFamily: "JetBrains Mono, monospace",
      headingWeight: 500
    }
  },
  hero: {
    badge: "NOVA 2.0 WORKSPACE PREVIEW",
    heading: "BUILD WHAT MATTERS.",
    subtitle: "NOVA brings planning, AI-assisted execution, and product intelligence into one focused workspace.",
    primaryCta: {
      label: "START BUILDING →",
      href: "#pricing"
    },
    secondaryCta: {
      label: "WATCH DEMO",
      href: "#product-story"
    },
    productPreview: {
      defaultProjectTitle: "Unified Core Platform 2.0",
      defaultSprintStatus: "Sprint 48 • 84% Complete",
      activeAiPrompt: "Summarize this project",
      activeAiResponse: "Three blockers are slowing the release cycle. Pipeline latency resolved; 4 tasks awaiting PR review in auth service."
    }
  },
  trustedBy: {
    heading: "POWERING TEAMS BUILDING THE FUTURE",
    companies: [
      { name: "Northstar", symbol: "✦" },
      { name: "Orbit", symbol: "◎" },
      { name: "Frame", symbol: "◫" },
      { name: "Field", symbol: "❖" },
      { name: "Vertex", symbol: "▲" },
      { name: "Arc", symbol: "⌒" }
    ]
  },
  productStory: {
    headline: "ONE WORKSPACE. LESS FRICTION.",
    subtitle: "From the first idea to the final release, NOVA keeps your product work connected and visible.",
    steps: [
      {
        id: "plan",
        stepNumber: "01",
        name: "Plan",
        tagline: "Spec with technical precision",
        description: "Draft requirements, connect engineering roadmaps, and eliminate ambiguity before writing a single line of code.",
        badge: "SPEC & ROADMAP"
      },
      {
        id: "build",
        stepNumber: "02",
        name: "Build",
        tagline: "High-velocity issue execution",
        description: "Kanban and list workflows built with keyboard shortcuts, git hooks, and automatic branch state sync.",
        badge: "DEV EXECUTION"
      },
      {
        id: "ai",
        stepNumber: "03",
        name: "AI Assistance",
        tagline: "Deep context intelligence",
        description: "Autonomous reasoning across your codebase, tickets, and docs to detect blockers and synthesize releases.",
        badge: "CONTEXT AWARE"
      },
      {
        id: "insights",
        stepNumber: "04",
        name: "Insights",
        tagline: "Engineering signals without noise",
        description: "Cycle time distributions, velocity charts, and bottleneck telemetry with no manual status meetings.",
        badge: "REAL-TIME TELEMETRY"
      },
      {
        id: "ship",
        stepNumber: "05",
        name: "Ship",
        tagline: "Automated release momentum",
        description: "One-click deployment verifications, automated changelog generation, and immediate team sync.",
        badge: "ZERO FRICTION"
      }
    ]
  },
  features: {
    heading: "PLAN WITH CLARITY.",
    description: "Break down complex roadmaps into atomic engineering workflows. Real-time updates without the overhead.",
    items: [
      {
        id: "specifications",
        category: "SPECIFICATIONS",
        title: "Bidirectional Roadmap Specs",
        description: "Every feature document lives directly alongside its tracking items, PRs, and telemetry.",
        iconName: "FileCode2",
        previewType: "board"
      },
      {
        id: "dependency-graph",
        category: "GRAPH",
        title: "Automated Dependency Trees",
        description: "Detect circular blockers and team dependencies before sprints commit.",
        iconName: "GitFork",
        previewType: "graph"
      },
      {
        id: "deep-search",
        category: "COMMAND BAR",
        title: "Sub-50ms Universal Search",
        description: "Find issues, commits, documentation, and pull requests instantly using keyboard shortcuts.",
        iconName: "Search",
        previewType: "code"
      }
    ]
  },
  aiFeature: {
    heading: "AI THAT KNOWS THE CONTEXT.",
    subtitle: "Grounding your team's workflow in real repository state, past issues, and architectural decisions.",
    prompts: [
      "Summarize this project.",
      "Find blockers.",
      "Draft a release update.",
      "Group related issues."
    ],
    capabilities: [
      { title: "Continuous Codebase Indexing", desc: "Always synced with your active git branches and schema diffs." },
      { title: "Blocker Triage", desc: "Surfaces unresolved dependency deadlocks before sprint retrospectives." },
      { title: "Automated Change Summaries", desc: "Generates engineer-grade notes directly from merged pull requests." }
    ]
  },
  analytics: {
    heading: "SEE THE SIGNAL.",
    subtitle: "Telemetry built for high-output engineering orgs. Measure throughput, cycle velocity, and release risk.",
    metrics: [
      { label: "Cycle Time", value: "1.4d", delta: "-38% this cycle", positive: true },
      { label: "Deployment Velocity", value: "32/wk", delta: "+4.2x from Q2", positive: true },
      { label: "Resolved Blockers", value: "98.2%", delta: "+12% faster triage", positive: true },
      { label: "Review Latency", value: "2.8h", delta: "-55% wait time", positive: true }
    ]
  },
  integrations: {
    heading: "WORKS WITH YOUR STACK.",
    subtitle: "Integrates deeply into developer toolchains, CI/CD pipelines, and design systems.",
    tools: [
      { name: "Git Engine", category: "Source Control", description: "Bi-directional branch and PR status synchronization", icon: "GitPullRequest" },
      { name: "Design System", category: "Design", description: "Inspect Figma frames and token updates directly in issues", icon: "Layers" },
      { name: "Docs & Specs", category: "Knowledge", description: "Markdown-first technical specifications with live embed widgets", icon: "FileText" },
      { name: "Team Slack", category: "Comms", description: "Bi-directional alerts, slash commands, and threaded updates", icon: "MessageSquare" },
      { name: "Cloud Deploy", category: "Infrastructure", description: "Automatic environment link previews and release checks", icon: "Cloud" },
      { name: "Analytics & Telemetry", category: "Observability", description: "Correlate exceptions and performance regressions with releases", icon: "BarChart3" }
    ]
  },
  workflow: {
    heading: "FROM IDEA TO SHIPPED.",
    steps: [
      {
        number: "01",
        title: "CAPTURE",
        description: "Record bugs, requests, and feature explorations instantly with global hotkeys and CLI commands.",
        details: ["Global command palette", "CLI capture tool", "Automated duplicate detection"]
      },
      {
        number: "02",
        title: "PLAN",
        description: "Group tasks into milestones, link specs, and set engineering constraints with zero spreadsheet drag.",
        details: ["Milestone burn-down graphs", "Cross-team dependencies", "Automated capacity forecasting"]
      },
      {
        number: "03",
        title: "BUILD",
        description: "Engineers stay in their flow state with fast keyboard-driven triage, git auto-closing, and dark mode UI.",
        details: ["Git branch automation", "Instant issue transitions", "PR health checks"]
      },
      {
        number: "04",
        title: "SHIP",
        description: "Trigger releases, verify staging health, and automatically notify stakeholders with generated notes.",
        details: ["Canary verification", "Automated changelogs", "Customer release alerts"]
      }
    ]
  },
  caseStudy: {
    tag: "CASE STUDY",
    client: "Northstar Engineering",
    headline: "How Northstar reduced product handoff friction by 64%.",
    description: "Northstar scaled from 12 to 85 engineers while maintaining sub-2 day cycle times using NOVA Workspace's unified context engine.",
    metrics: [
      { label: "Sprint Cycle Time", value: "-42%", change: "reduced from 3.8 days to 1.4 days" },
      { label: "Cross-Team Syncs", value: "3.8x", change: "faster resolution of shared blockers" },
      { label: "Release Predictability", value: "99.4%", change: "on-time scheduled deployment rate" }
    ]
  },
  security: {
    heading: "SECURITY, BY DEFAULT.",
    subtitle: "Engineered from the foundation with strict isolation, granular access, and verifiable provenance.",
    pillars: [
      {
        title: "End-to-End Workspace Encryption",
        description: "All project specs, discussion threads, and AI contextual embeddings are encrypted in transit and at rest.",
        tags: ["TLS 1.3", "AES-256-GCM", "Zero-Knowledge Enclaves"]
      },
      {
        title: "Granular Role-Based Permissions",
        description: "Fine-grained ACLs scoping access down to single repositories, projects, or individual documents.",
        tags: ["Custom Roles", "SAML SSO", "SCIM Provisioning"]
      },
      {
        title: "Immutable Audit Logs",
        description: "Every issue transition, API call, and permission change is recorded in tamper-evident logs.",
        tags: ["Real-time SIEM Export", "Cryptographic Hashing", "Retention Policies"]
      },
      {
        title: "Isolated AI Processing",
        description: "Your code and private context never train public foundation models or leave your deployment perimeter.",
        tags: ["Tenant Isolation", "No Model Training", "Private VPC Available"]
      }
    ]
  },
  pricing: {
    heading: "INVEST IN VELOCITY.",
    subtitle: "Transparent pricing designed for teams of all scales. No hidden fees or seat penalties.",
    billingIntervals: ["monthly", "yearly"],
    plans: [
      {
        id: "free",
        name: "Starter",
        priceMonthly: 0,
        priceYearly: 0,
        description: "Essential workspace for fast-moving early teams and solo creators.",
        features: [
          "Up to 5 team members",
          "Unlimited issues & roadmaps",
          "Basic AI context assistant (50 req/mo)",
          "Standard git integrations",
          "Community support"
        ],
        ctaLabel: "Start Free",
        ctaHref: "#"
      },
      {
        id: "pro",
        name: "Pro",
        priceMonthly: 24,
        priceYearly: 20,
        description: "Complete velocity acceleration for scaling product and engineering squads.",
        highlighted: true,
        features: [
          "Unlimited team members",
          "Advanced contextual AI reasoning",
          "Cycle time and velocity telemetry",
          "Cross-project dependency graphs",
          "Private custom integrations",
          "Priority 24/7 technical support"
        ],
        ctaLabel: "Start 14-Day Trial",
        ctaHref: "#"
      },
      {
        id: "business",
        name: "Enterprise",
        priceMonthly: 49,
        priceYearly: 42,
        description: "Dedicated security, tenant isolation, and custom SLA for larger organizations.",
        features: [
          "SAML SSO & automated SCIM",
          "Dedicated VPC and isolated AI enclaves",
          "Custom data retention policies",
          "Audit log streaming to Datadog/Splunk",
          "Designated customer success architect",
          "Custom 99.99% uptime SLA guarantee"
        ],
        ctaLabel: "Contact Enterprise",
        ctaHref: "#"
      }
    ]
  },
  faq: {
    heading: "FREQUENTLY ASKED QUESTIONS",
    subtitle: "Everything you need to know about NOVA Workspace and how it fits into your workflow.",
    questions: [
      {
        question: "What is NOVA?",
        answer: "NOVA is a unified product and engineering workspace that merges issue tracking, technical specifications, contextual AI assistance, and delivery telemetry into one ultra-fast interface."
      },
      {
        question: "Who is it for?",
        answer: "NOVA is designed specifically for modern product managers, software engineers, and technical founders who demand high velocity and want to eliminate fragmented tools."
      },
      {
        question: "How does AI work inside NOVA?",
        answer: "NOVA's AI is grounded strictly in your team's live context—including repository status, active tickets, specifications, and architecture decisions. It runs in isolated enclaves and never trains foundation models on your intellectual property."
      },
      {
        question: "Can NOVA integrate with existing tools?",
        answer: "Yes. NOVA has deep bidirectional integrations with Git providers (GitHub, GitLab), Slack, Figma, terminal CLI tools, and major CI/CD deployment systems."
      },
      {
        question: "Can teams collaborate in real time?",
        answer: "Yes. All task lists, specs, and status transitions sync with sub-50ms latency using our peer-validated state sync architecture."
      },
      {
        question: "Is there an API?",
        answer: "Absolutely. We offer a comprehensive GraphQL and REST API, Webhooks for all workflow events, and a TypeScript AI SDK to automate routine engineering actions."
      }
    ]
  },
  finalCta: {
    heading: "MAKE THE NEXT THING BETTER.",
    subtitle: "Give your team one focused place to think, build and ship.",
    primaryCta: {
      label: "START BUILDING →",
      href: "#pricing"
    },
    secondaryCta: {
      label: "TALK TO SALES",
      href: "#"
    }
  },
  footer: {
    columns: [
      {
        title: "PRODUCT",
        links: [
          { label: "Overview", href: "#hero" },
          { label: "Interactive Demo", href: "#product-story" },
          { label: "AI Engine", href: "#ai" },
          { label: "Analytics", href: "#analytics" },
          { label: "Pricing", href: "#pricing" }
        ]
      },
      {
        title: "RESOURCES",
        links: [
          { label: "Documentation", href: "/features" },
          { label: "API Reference", href: "/about" },
          { label: "Changelog", href: "/about" },
          { label: "System Status", href: "/security" }
        ]
      },
      {
        title: "COMPANY",
        links: [
          { label: "About NOVA", href: "/about" },
          { label: "Customers", href: "/customers" },
          { label: "Careers", href: "/about" },
          { label: "Security", href: "/security" }
        ]
      },
      {
        title: "LEGAL",
        links: [
          { label: "Privacy Policy", href: "/security" },
          { label: "Terms of Service", href: "/security" },
          { label: "Security Center", href: "/security" },
          { label: "Subprocessors", href: "/security" }
        ]
      }
    ],
    copyright: "© 2026 NOVA Workspace Inc. All rights reserved. Designed with precision."
  }
};

export default defaultThemeSchema;
