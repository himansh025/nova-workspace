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
      className="section-spacing bg-[var(--color-background)] border-t border-[var(--color-border)]"
    >
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Context Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal>
              <SectionLabel tag="03">CONTEXTUAL INTELLIGENCE</SectionLabel>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="section-title text-[var(--color-foreground)] uppercase">
                AI THAT KNOWS
                <br />
                <span className="text-[var(--color-accent)]">THE CONTEXT.</span>
              </h2>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-base text-[var(--color-muted)] leading-relaxed">
                Generic chatbots write toy code snippets. NOVA understands your
                entire product architecture—from Figma design tokens to database
                migrations—enabling instant synthesis of blockers, changes, and
                sprint momentum.
              </p>
            </Reveal>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
              {highlights.map((h, i) => (
                <Reveal key={i} delay={0.25 + i * 0.08}>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded bg-[var(--color-accent-subtle)] text-[var(--color-accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[var(--color-foreground)]">
                        {h.title}
                      </h4>
                      <p className="text-xs text-[var(--color-muted)] mt-0.5 leading-relaxed">
                        {h.desc}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right Column: Realistic Interactive AI Panel Preview */}
          <div className="lg:col-span-7">
            <Reveal delay={0.2}>
              <div className="rounded-2xl border border-white/10 bg-[#0E1015] shadow-xl overflow-hidden h-[540px]">
                <AIPanel />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeature;
