"use client";

import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import Chart from "@/components/product-ui/Chart";
import { analyticsMetrics } from "@/data/landing-content";

export const AnalyticsSection: React.FC = () => {
  const metrics = analyticsMetrics;

  return (
    <section
      id="analytics"
      className="section-spacing bg-[var(--landing-bg)] text-[var(--landing-text)] border-t border-[var(--landing-border)] relative overflow-hidden"
    >
      <div className="container-site">
        <div className="max-w-2xl mb-14">
          <Reveal>
            <SectionLabel tag="05">
              VELOCITY & TELEMETRY
            </SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--landing-text)] uppercase mt-4">
              SEE THE
              <br />
              <span className="text-[var(--landing-primary)]">SIGNAL.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--landing-text-muted)] leading-relaxed">
              No subjective status meetings or survey friction. NOVA continuously
              computes real cycle times, review latency, and deployment velocity
              straight from your git stream.
            </p>
          </Reveal>
        </div>

        {/* 4 Metric Callout Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, idx) => (
            <Reveal key={m.label} delay={0.1 * idx}>
              <div className="p-5 rounded-2xl bg-[var(--landing-surface)] border border-[var(--landing-border)] shadow-xs hover:border-[var(--landing-border-strong)] transition-all">
                <span className="text-xs font-mono text-[var(--landing-text-muted)] uppercase">
                  {m.label}
                </span>
                <div className="text-3xl font-medium tracking-tight text-[var(--landing-text)] my-2">
                  {m.value}
                </div>
                <div className="text-xs font-mono text-[var(--landing-success)] font-medium flex items-center gap-1">
                  <span>✦</span>
                  <span>{m.delta}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* SVG Chart Demonstration */}
        <Reveal delay={0.25}>
          <div className="p-3 rounded-3xl bg-[var(--landing-surface-muted)] border border-[var(--landing-border-strong)] shadow-[0_20px_40px_rgba(23,23,23,0.06)]">
            <Chart isDark={true} />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default AnalyticsSection;
