export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "AI & Context" | "Integrations" | "Security";
}

export const faqList: FAQItem[] = [
  {
    id: "faq-1",
    question: "What is NOVA?",
    answer: "NOVA is a high-velocity AI workspace engineered for modern product and engineering teams. It converges technical roadmap specifications, issue tracking, contextual AI reasoning, and delivery telemetry into one unified, sub-millisecond interface.",
    category: "General"
  },
  {
    id: "faq-2",
    question: "Who is it for?",
    answer: "NOVA is built for product managers, software engineers, engineering leads, and technical founders who value speed, precision, and architectural clarity over bloated legacy project management suites.",
    category: "General"
  },
  {
    id: "faq-3",
    question: "How does AI work?",
    answer: "Unlike generic chatbot overlays, NOVA's contextual AI indexes your actual repositories, pull requests, schema migrations, and discussion threads. It proactively identifies cross-team dependency deadlocks, summarizes release deltas, and answers complex codebase architecture questions in real time without training third-party public models.",
    category: "AI & Context"
  },
  {
    id: "faq-4",
    question: "Can NOVA integrate with existing tools?",
    answer: "Yes. NOVA connects natively with GitHub, GitLab, Slack, Figma, terminal CLI workflows, and cloud CI/CD pipelines like Vercel and AWS. Updates reflect bidirectionally with zero lag.",
    category: "Integrations"
  },
  {
    id: "faq-5",
    question: "Can teams collaborate?",
    answer: "Yes. Collaborative editing across specifications, task boards, and roadmaps uses a high-performance Conflict-free Replicated Data Type (CRDT) engine, delivering sub-50ms multiplayer updates with full offline resilience.",
    category: "General"
  },
  {
    id: "faq-6",
    question: "Is there an API?",
    answer: "Yes. We offer an exhaustive GraphQL API, high-volume Webhooks for every lifecycle event, and an official TypeScript AI SDK that allows you to script automations and extend NOVA into your existing internal developer portals.",
    category: "Integrations"
  }
];
