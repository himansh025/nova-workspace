export interface NavItem {
  label: string;
  href: string;
  badge?: string;
}

export const navigationItems: NavItem[] = [
  { label: "Product", href: "#product-story" },
  { label: "Solutions", href: "#workflow" },
  { label: "Features", href: "#ai" },
  { label: "Customers", href: "#case-study" },
  { label: "Pricing", href: "#pricing" }
];

export const secondaryNavItems: NavItem[] = [
  { label: "Security", href: "#security" },
  { label: "Integrations", href: "#integrations" },
  { label: "Analytics", href: "#analytics" },
  { label: "FAQ", href: "#faq" }
];

export const footerNavigation = {
  product: [
    { label: "Overview", href: "#hero" },
    { label: "Interactive Story", href: "#product-story" },
    { label: "Contextual AI", href: "#ai" },
    { label: "Engineering Telemetry", href: "#analytics" },
    { label: "Integrations", href: "#integrations" },
    { label: "Pricing", href: "#pricing" }
  ],
  resources: [
    { label: "Documentation", href: "/features" },
    { label: "API Reference", href: "/about" },
    { label: "Changelog v2.4.0", href: "/about" },
    { label: "Engineering Blog", href: "/about" },
    { label: "Community Discord", href: "#" }
  ],
  company: [
    { label: "About NOVA", href: "/about" },
    { label: "Customers", href: "/customers" },
    { label: "Careers (We're Hiring)", href: "/about" },
    { label: "Press Kit", href: "/about" }
  ],
  legal: [
    { label: "Security Whitepaper", href: "/security" },
    { label: "Privacy Policy", href: "/security" },
    { label: "Terms of Service", href: "/security" },
    { label: "Compliance & SOC2", href: "/security" }
  ]
};
