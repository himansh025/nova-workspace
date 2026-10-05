import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AIFeature from "@/components/saas/AIFeature";
import WorkflowSection from "@/components/saas/WorkflowSection";
import AnalyticsSection from "@/components/saas/AnalyticsSection";
import IntegrationsSection from "@/components/saas/IntegrationsSection";
import FinalCTA from "@/components/saas/FinalCTA";

export const metadata: Metadata = {
  title: "Features & Architecture — NOVA Workspace",
  description:
    "Explore the technical architecture of NOVA Workspace: specifications, contextual AI reasoning, real-time telemetry, and developer integrations."
};

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
        <AIFeature />
        <WorkflowSection />
        <AnalyticsSection />
        <IntegrationsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
