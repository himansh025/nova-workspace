"use client";

import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import Chart from "@/components/product-ui/Chart";
import { defaultThemeSchema } from "@/theme.schema";

export const AnalyticsSection: React.FC = () => {
  const metrics = defaultThemeSchema.analytics.metrics;

  return (
    <section
      id="analytics"
      className="section-spacing bg-[#0A0B0E] text-white border-t border-white/10 relative overflow-hidden"
    >
      <div className="container-site">
        <div className="max-w-2xl mb-14">
          <Reveal>
            <SectionLabel isDark tag="05">
              VELOCITY & TELEMETRY
            </SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-white uppercase mt-4">
              SEE THE
              <br />
              <span className="text-[var(--color-accent)]">SIGNAL.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-neutral-400 leading-relaxed">
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
              <div className="p-5 rounded-xl bg-[#12141B] border border-white/10 hover:border-white/20 transition-all">
                <span className="text-xs font-mono text-neutral-400 uppercase">
                  {m.label}
                </span>
                <div className="text-3xl font-medium tracking-tight text-white my-2">
                  {m.value}
                </div>
                <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <span>✦</span>
                  <span>{m.delta}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* SVG Chart Demonstration */}
        <Reveal delay={0.25}>
          <Chart isDark={true} />
        </Reveal>
      </div>
    </section>
  );
};

export default AnalyticsSection;
