import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SecuritySection from "@/components/saas/SecuritySection";
import FAQSection from "@/components/saas/FAQSection";
import FinalCTA from "@/components/saas/FinalCTA";

export const metadata: Metadata = {
  title: "Security, Compliance & Isolation — NOVA Workspace",
  description:
    "Enterprise-grade security foundations: zero-retention AI enclaves, cryptographic audit logs, granular RBAC, and SOC2 compliance."
};

export default function SecurityPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20">
        <SecuritySection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
