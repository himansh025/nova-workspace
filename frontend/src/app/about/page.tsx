import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/saas/FinalCTA";
import SectionLabel from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "About NOVA  Turning Ideas into Momentum",
  description:
    "Learn about NOVA's mission to eliminate engineering friction and build the next generation of contextual product workspaces."
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-1 pt-16 sm:pt-20 pb-20">
        <div className="container-site max-w-4xl mx-auto space-y-16">
          <div>
            <SectionLabel tag="MISSION">ABOUT NOVA</SectionLabel>
            <h1 className="hero-title text-[var(--color-foreground)] uppercase mt-6 mb-8">
              TURN IDEAS
              <br />
              <span className="text-[var(--color-accent)]">INTO MOMENTUM.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--color-muted)] leading-relaxed">
              We started NOVA with a simple belief: modern engineering and product
              teams spend too much time navigating tool silos, hunting for spec
              updates, and sitting in status alignment meetings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[var(--color-border)]">
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-[var(--color-foreground)]">
                Precision & Speed
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Every interaction inside NOVA is designed for sub-50ms feedback.
                Keyboard-first command palettes, optimistic local CRDT state, and
                zero bloated spinner states.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-[var(--color-foreground)]">
                Contextual Intelligence
              </h3>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Rather than treating AI as a generic chatbot, NOVA grounds
                reasoning in your living code repository graph, PR review threads,
                and architectural decisions.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </div>
  );
}
