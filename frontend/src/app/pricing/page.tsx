import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PricingSection from "@/components/saas/PricingSection";
import FAQSection from "@/components/saas/FAQSection";
import FinalCTA from "@/components/saas/FinalCTA";

export const metadata: Metadata = {
  title: "Pricing & Plans — NOVA Workspace",
  description:
    "Transparent, predictable plans for high-velocity software squads. Start free or upgrade for enterprise AI reasoning and security isolation."
};

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
        <PricingSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
