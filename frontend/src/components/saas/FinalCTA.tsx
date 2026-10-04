"use client";

import React from "react";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { Sparkles, ArrowRight } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-28 md:py-36 bg-[#F3EDE2] text-[var(--landing-text)] relative overflow-hidden border-t border-[var(--landing-border)]">
      {/* Background subtle technical grid */}
      <div className="absolute inset-0 tech-grid opacity-40 pointer-events-none" />

      {/* Abstract product interface silhouette backdrop */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 border border-[var(--landing-border-strong)] rounded-2xl bg-[var(--landing-surface)]/80 backdrop-blur-sm pointer-events-none opacity-40 shadow-xl overflow-hidden hidden md:block">
        <div className="h-7 border-b border-[var(--landing-border)] flex items-center px-4 gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--landing-text-muted)]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--landing-text-muted)]/30" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--landing-text-muted)]/30" />
        </div>
        <div className="p-6 grid grid-cols-3 gap-4 opacity-50">
          <div className="h-16 rounded bg-[var(--landing-surface-muted)]" />
          <div className="h-16 rounded bg-[var(--landing-surface-muted)]" />
          <div className="h-16 rounded bg-[var(--landing-surface-muted)]" />
        </div>
      </div>

      <div className="container-site relative z-10 text-center max-w-3xl mx-auto">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--landing-primary-subtle)] border border-[var(--landing-primary-border)] text-xs font-mono text-[var(--landing-primary)] mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-semibold">START YOUR 14-DAY TRIAL</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="hero-title text-[var(--landing-text)] uppercase tracking-tight">
            MAKE THE NEXT
            <br />
            <span className="text-[var(--landing-primary)]">
              THING BETTER.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-6 text-base md:text-xl text-[var(--landing-text-muted)] font-normal leading-relaxed max-w-xl mx-auto">
            Give your team one focused place to think, build and ship. Zero
            spreadsheet drag. Sub-50ms execution.
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 text-base px-6.5 py-3.5 rounded-xl bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white shadow-xs active:scale-[0.99]"
            >
              <span>START BUILDING</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 text-base px-6.5 py-3.5 rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] text-[var(--landing-text)] hover:bg-[var(--landing-surface-muted)] active:scale-[0.99]"
            >
              <span>TALK TO SALES</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-mono text-[var(--landing-text-muted)]">
            <span>No credit card required</span>
            <span>•</span>
            <span>14-day free trial</span>
            <span>•</span>
            <span>SOC2 Type II compliant</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default FinalCTA;
