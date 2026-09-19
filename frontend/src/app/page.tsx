import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/saas/Hero";
import LogoStrip from "@/components/saas/LogoStrip";
import ProductStory from "@/components/saas/ProductStory";
import AIFeature from "@/components/saas/AIFeature";
import WorkflowSection from "@/components/saas/WorkflowSection";
import AnalyticsSection from "@/components/saas/AnalyticsSection";
import IntegrationsSection from "@/components/saas/IntegrationsSection";
import CaseStudySection from "@/components/saas/CaseStudySection";
import SecuritySection from "@/components/saas/SecuritySection";
import PricingSection from "@/components/saas/PricingSection";
import FAQSection from "@/components/saas/FAQSection";
import FinalCTA from "@/components/saas/FinalCTA";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 4. HEADER */}
      <Header />

      <main className="flex-1">
        {/* 5, 6, 7, 8, 9. HERO & PRODUCT PREVIEW */}
        <Hero />

        {/* 10. TRUSTED TEAMS / LOGO STRIP */}
        <LogoStrip />

        {/* 11, 12, 13. PRODUCT INTRO & PINNED INTERACTIVE STORY (PLAN, BUILD, AI, INSIGHTS, SHIP) */}
        <ProductStory />

        {/* 14, 15. AI CONTEXTUAL FEATURE */}
        <AIFeature />

        {/* 16, 19. TASK WORKFLOW & EDITORIAL CADENCE */}
        <WorkflowSection />

        {/* 17. ANALYTICS: SEE THE SIGNAL */}
        <AnalyticsSection />

        {/* 18. INTEGRATIONS: WORKS WITH YOUR STACK */}
        <IntegrationsSection />

        {/* 20. CUSTOMER STORY: NORTHSTAR CASE STUDY */}
        <CaseStudySection />

        {/* 21, 22. DEVELOPER PLATFORM & SECURITY BY DEFAULT */}
        <SecuritySection />

        {/* 23. PRICING TIERS */}
        <PricingSection />

        {/* 24. FREQUENTLY ASKED QUESTIONS */}
        <FAQSection />

        {/* 25. FINAL IMMERSIVE CTA */}
        <FinalCTA />
      </main>

      {/* 26. DARK FOOTER */}
      <Footer />
    </div>
  );
}
