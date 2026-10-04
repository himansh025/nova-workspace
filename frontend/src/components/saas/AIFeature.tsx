import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import AIPanel from "@/components/product-ui/AIPanel";
import Reveal from "@/components/ui/Reveal";
import { CheckCircle2 } from "lucide-react";

export const AIFeature: React.FC = () => {
  const highlights = [
    {
      title: "Grounded in Repository State",
      desc: "Answers are derived directly from live PR diffs, AST schema graphs, and commit histories."
    },
    {
      title: "Cross-Dependency Blocker Detection",
      desc: "Proactively alerts engineers to deadlock dependencies before sprint retrospectives."
    },
    {
      title: "Zero Foundation Model Training",
      desc: "Your code and private documents execute strictly inside isolated, zero-retention enclaves."
    }
  ];

  return (
    <section
      id="ai"
      className="section-spacing bg-[#FDF7F5] border-t border-[var(--landing-border)]"
    >
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Context Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal>
              <SectionLabel tag="03">CONTEXTUAL INTELLIGENCE</SectionLabel>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="section-title text-[var(--landing-text)] uppercase">
                AI THAT KNOWS
                <br />
                <span className="text-[var(--landing-primary)]">THE CONTEXT.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-base text-[var(--landing-text-muted)] leading-relaxed">
                Generic chatbots write toy code snippets. NOVA understands your
                entire product architecture—from Figma design tokens to database
                migrations—enabling instant synthesis of blockers, changes, and
                sprint momentum.
              </p>
            </Reveal>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-4 border-t border-[var(--landing-border)]">
              {highlights.map((h, i) => (
                <Reveal key={i} delay={0.25 + i * 0.08}>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[var(--landing-primary-subtle)] text-[var(--landing-primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--landing-text)]">
                        {h.title}
                      </h4>
                      <p className="text-xs text-[var(--landing-text-muted)] mt-0.5 leading-relaxed">
                        {h.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right Column: Framed Interactive AI Panel Preview */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2}>
              <div className="p-3 rounded-3xl bg-[var(--landing-surface-muted)] border border-[var(--landing-border-strong)] shadow-[0_20px_40px_rgba(200,90,63,0.06)]">
                <div className="rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-sidebar)] shadow-xl overflow-hidden h-[540px]">
                  <AIPanel />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeature;
