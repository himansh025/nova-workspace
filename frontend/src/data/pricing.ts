export interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  priceMonthly: number;
  priceYearly: number;
  highlighted?: boolean;
  badge?: string;
  description: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
}

export const pricingPlans: PricingTier[] = [
  {
    id: "free",
    name: "Starter",
    tagline: "Essential velocity for founders and small squads",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Get started with high-velocity issue tracking and essential roadmap planning at zero cost.",
    features: [
      "Up to 5 team members",
      "Unlimited projects & issue boards",
      "Sub-50ms keyboard command palette",
      "Git branch & pull request sync",
      "50 AI contextual queries / month",
      "Community Slack access"
    ],
    ctaText: "Start Free",
    ctaHref: "#"
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Unleash maximum momentum for scaling engineering teams",
    priceMonthly: 24,
    priceYearly: 20,
    highlighted: true,
    badge: "MOST POPULAR",
    description: "The complete AI workspace with real-time telemetry, automated blocker triage, and cross-team dependencies.",
    features: [
      "Unlimited team members",
      "Unlimited contextual AI reasoning",
      "Autonomous blocker triage & PR summaries",
      "Cycle time & DORA metrics telemetry",
      "Cross-repository dependency graphs",
      "Bidirectional Figma & Slack sync",
      "Full GraphQL & REST API access",
      "Priority email & chat support"
    ],
    ctaText: "Start 14-Day Free Trial",
    ctaHref: "#"
  },
  {
    id: "business",
    name: "Enterprise",
    tagline: "Dedicated isolation, governance, and custom security SLAs",
    priceMonthly: 49,
    priceYearly: 42,
    badge: "ENTERPRISE GRADE",
    description: "Custom compliance, VPC isolation, and dedicated solutions engineering for enterprise scale.",
    features: [
      "Everything in Pro plus:",
      "SAML 2.0 SSO & automated SCIM provisioning",
      "Zero-data-retention AI processing enclave",
      "Custom data retention & audit logging to SIEM",
      "Dedicated Customer Success Architect",
      "Custom 99.99% uptime SLA guarantee",
      "Annual invoicing & custom legal terms"
    ],
    ctaText: "Talk to Sales",
    ctaHref: "#"
  }
];

export const pricingFaq = [
  {
    q: "Can I switch plans or billing intervals at any time?",
    a: "Yes. You can switch between monthly and annual billing, or upgrade/downgrade your tier directly from workspace settings. Prorated credits apply automatically."
  },
  {
    q: "Do you offer discounts for open source projects or early startups?",
    a: "Yes! Qualified early-stage startups and approved open-source initiatives can receive up to 12 months of free access to NOVA Pro."
  }
];
