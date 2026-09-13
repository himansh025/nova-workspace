import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LogoStrip from "@/components/saas/LogoStrip";
import CaseStudySection from "@/components/saas/CaseStudySection";
import FinalCTA from "@/components/saas/FinalCTA";

export const metadata: Metadata = {
  title: "Customers & Engineering Case Studies — NOVA Workspace",
  description:
    "Discover how leading product and engineering teams use NOVA to reduce handoff friction and accelerate cycle times."
};

export default function CustomersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-20">
        <LogoStrip />
        <CaseStudySection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
