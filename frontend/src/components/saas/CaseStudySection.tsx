"use client";

import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import ArrowLink from "@/components/ui/ArrowLink";
import { caseStudyData } from "@/data/landing-content";

export const CaseStudySection: React.FC = () => {
  const caseStudy = caseStudyData;

  return (
    <section
      id="case-study"
      className="section-spacing bg-[var(--landing-bg)] border-t border-[var(--landing-border)]"
    >
      <div className="container-site">
        <div className="rounded-3xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 sm:p-10 md:p-14 relative overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Story narrative */}
            <div className="lg:col-span-7 space-y-6">
              <Reveal>
                <div className="flex items-center gap-3">
                  <SectionLabel tag="SAMPLE">CASE STUDY</SectionLabel>
                  <span className="text-xs font-mono text-[var(--landing-text-muted)]">
                    {"// Demonstration"}
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h3 className="section-title text-[var(--landing-text)] tracking-tight">
                  How Northstar reduced product handoff friction by 64%.
                </h3>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-sm md:text-base text-[var(--landing-text-muted)] leading-relaxed">
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
                  <div className="p-5 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface-muted)] flex flex-col justify-between">
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-xs font-mono text-[var(--landing-text-muted)] uppercase">
                        {m.label}
                      </span>
                      <span className="text-2xl font-bold font-mono text-[var(--landing-primary)]">
                        {m.value}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--landing-text-muted)]">
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
