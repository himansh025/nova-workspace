"use client";

import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import ArrowLink from "@/components/ui/ArrowLink";
import { defaultThemeSchema } from "@/theme.schema";

export const CaseStudySection: React.FC = () => {
  const caseStudy = defaultThemeSchema.caseStudy;

  return (
    <section
      id="case-study"
      className="section-spacing bg-[var(--color-surface)] border-t border-[var(--color-border)]"
    >
      <div className="container-site">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-8 md:p-14 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Story narrative */}
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
                <div className="flex items-center gap-3">
                  <SectionLabel tag="SAMPLE">CASE STUDY</SectionLabel>
                  <span className="text-xs font-mono text-[var(--color-muted)]">
                    {"// Demonstration"}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h3 className="section-title text-[var(--color-foreground)] tracking-tight">
                  How Northstar reduced product handoff friction by 64%.
                </h3>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-sm md:text-base text-[var(--color-muted)] leading-relaxed">
                  As Northstar expanded from 12 to 85 engineers across three
                  continents, specification drift and fragmented task tracking
                  tripled cycle times. By consolidating engineering specs, issues,
                  and contextual AI into NOVA Workspace, their squads eliminated
                  manual handoff reviews.
                </p>
              </Reveal>

              <Reveal delay={0.25}>
                <ArrowLink href="/customers">
                  Read full architecture breakdown
                </ArrowLink>
              </Reveal>
            </div>

            {/* 3 Quantifiable Metrics */}
            <div className="lg:col-span-5 space-y-4">
              {caseStudy.metrics.map((m, idx) => (
                <Reveal key={m.label} delay={0.15 * idx}>
                  <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col justify-between">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-mono text-[var(--color-muted)] uppercase">
                        {m.label}
                      </span>
                      <span className="text-2xl font-bold font-mono text-[var(--color-accent)]">
                        {m.value}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--color-muted)]">
                      {m.change}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CaseStudySection;
