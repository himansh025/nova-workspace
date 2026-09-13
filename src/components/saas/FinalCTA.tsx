"use client";

import React from "react";
import Button from "@/components/ui/Button";
import Reveal from "@/components/ui/Reveal";
import { Sparkles } from "lucide-react";

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-28 md:py-36 bg-[#08090C] text-white relative overflow-hidden border-t border-white/10">
      {/* Background subtle technical grid and radial glow */}
      <div className="absolute inset-0 dark-tech-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[var(--color-accent)]/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Abstract product interface silhouette backdrop */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl h-72 border border-white/10 rounded-2xl bg-[#0D0E13]/80 backdrop-blur-sm pointer-events-none opacity-40 shadow-2xl overflow-hidden hidden md:block">
        <div className="h-7 border-b border-white/10 flex items-center px-4 gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
        </div>
        <div className="p-6 grid grid-cols-3 gap-4 opacity-50">
          <div className="h-16 rounded bg-white/5" />
          <div className="h-16 rounded bg-white/5" />
          <div className="h-16 rounded bg-white/5" />
        </div>
      </div>

      <div className="container-site relative z-10 text-center max-w-3xl mx-auto">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono text-white mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>START YOUR 14-DAY TRIAL</span>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="hero-title text-white uppercase tracking-tight">
            MAKE THE NEXT
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-[var(--color-accent)]">
              THING BETTER.
            </span>
          </h2>
        </Reveal>

        <Reveal delay={0.2}>
          <p className="mt-6 text-base md:text-xl text-neutral-400 font-normal leading-relaxed max-w-xl mx-auto">
            Give your team one focused place to think, build and ship. Zero
            spreadsheet drag. Sub-50ms execution.
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button href="#pricing" variant="secondary" size="lg" withArrow>
              START BUILDING
            </Button>
            <Button href="#pricing" variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              TALK TO SALES
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-mono text-neutral-400">
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
