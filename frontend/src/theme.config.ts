export interface ThemeConfig {
  id: string;
  name: string;
  brand: string;
  product: string;
  tagline: string;
  version: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    dark: string;
    secondaryAccent?: string;
  };
  typography: {
    sans: string;
    mono: string;
  };
  features: {
    ai: boolean;
    analytics: boolean;
    integrations: boolean;
    pricing: boolean;
    productStory: boolean;
    caseStudy: boolean;
    security: boolean;
    developerSection: boolean;
  };
}

export const themeConfig: ThemeConfig = {
  id: "premium-ai-saas",
  name: "NOVA Workspace — Premium AI / SaaS",
  brand: "NOVA",
  product: "NOVA WORKSPACE",
  tagline: "TURN IDEAS INTO MOMENTUM.",
  version: "1.0.0",

  colors: {
    background: "#FBFBFC",
    foreground: "#0E1013",
    accent: "#5E43F3",
    dark: "#0B0C0E",
    secondaryAccent: "#0284C7"
  },

  typography: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  },

  features: {
    ai: true,
    analytics: true,
    integrations: true,
    pricing: true,
    productStory: true,
    caseStudy: true,
    security: true,
    developerSection: true
  }
};

export default themeConfig;
