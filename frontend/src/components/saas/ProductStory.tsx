"use client";

import React, { useEffect, useRef, useState } from "react";
import WorkspaceDemo from "./WorkspaceDemo";
import { initGsap, gsap } from "@/lib/animations/gsap";
import { initProductStoryTimeline } from "@/lib/animations/productStory";
import { prefersReducedMotion } from "@/lib/animations/reveal";
import { productStoryStages } from "@/data/product-demo";
import SectionLabel from "@/components/ui/SectionLabel";

export const ProductStory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyWrapperRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    initGsap();

    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024 || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      if (containerRef.current && stickyWrapperRef.current) {
        const container = containerRef.current;
        const tabs = tabRefs.current.filter(Boolean) as HTMLElement[];

        const planPanel = container.querySelector<HTMLElement>("[data-story-panel='plan']");
        const taskPanel = container.querySelector<HTMLElement>("[data-story-panel='task']");
        const aiPanel = container.querySelector<HTMLElement>("[data-story-panel='ai']");
        const insightsPanel = container.querySelector<HTMLElement>("[data-story-panel='insights']");
        const releasePanel = container.querySelector<HTMLElement>("[data-story-panel='release']");

        initProductStoryTimeline({
          container,
          stickyWrapper: stickyWrapperRef.current,
          planPanel,
          taskPanel,
          aiPanel,
          insightsPanel,
          releasePanel,
          navTabs: tabs,
          progressBar: progressBarRef.current
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="product-story"
      className="relative bg-[var(--landing-bg)] text-[var(--landing-text)] border-t border-[var(--landing-border)]"
    >
      {/* 11. PRODUCT INTRO HEADER */}
      <div className="pt-24 md:pt-32 pb-16 container-site text-center">
        <SectionLabel className="mb-5">
          ✦ SIGNATURE WORKSPACE ARCHITECTURE
        </SectionLabel>

        <h2 className="section-title text-[var(--landing-text)] uppercase max-w-3xl mx-auto tracking-tight">
          ONE WORKSPACE.
          <br />
          <span className="text-[var(--landing-primary)]">
            LESS FRICTION.
          </span>
        </h2>

        <p className="mt-5 text-base md:text-lg text-[var(--landing-text-muted)] max-w-2xl mx-auto leading-relaxed">
          From the first idea to the final release, NOVA keeps your product work
          connected and visible. Scroll to explore the end-to-end lifecycle.
        </p>
      </div>

      {/* Mobile & Tablet Fallback View (<1024px) */}
      <div className="block lg:hidden container-site pb-28">
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
          {productStoryStages.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => setActiveStep(idx)}
              className={`px-4 py-2 rounded-full text-xs font-mono tracking-wider shrink-0 transition-all ${
                activeStep === idx
                  ? "bg-[var(--landing-primary)] text-white font-semibold"
                  : "bg-[var(--landing-surface)] text-[var(--landing-text-muted)] border border-[var(--landing-border)] hover:text-[var(--landing-text)]"
              }`}
            >
              {stage.step} {stage.tab}
            </button>
          ))}
        </div>

        <div className="mb-6 p-5 rounded-2xl bg-[var(--landing-surface)] border border-[var(--landing-border)] shadow-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--landing-primary)] font-semibold">
            {productStoryStages[activeStep].badge}
          </span>
          <h3 className="text-lg font-medium text-[var(--landing-text)] mt-1">
            {productStoryStages[activeStep].title}
          </h3>
          <p className="text-xs text-[var(--landing-text-muted)] mt-1 leading-relaxed">
            {productStoryStages[activeStep].description}
          </p>
        </div>

        <div className="h-[520px] w-full relative drop-shadow-xl">
          <WorkspaceDemo currentStepIndex={activeStep} />
        </div>
      </div>

      {/* Desktop Pinned ScrollTrigger Container (>=1024px) */}
      <div ref={containerRef} className="hidden lg:block relative w-full">
        <div
          ref={stickyWrapperRef}
          className="relative w-full h-screen flex flex-col justify-between pt-16 pb-8 px-6 md:px-12 overflow-hidden bg-[var(--landing-bg)]"
        >
          {/* Stage Navigation Tabs & Progress Tracker */}
          <div className="max-w-6xl mx-auto w-full mb-4">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--landing-border)] pb-3">
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                {productStoryStages.map((stage, idx) => (
                  <button
                    key={stage.id}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-all duration-200 ${
                      idx === 0
                        ? "bg-[var(--landing-primary)] text-white font-semibold active-tab"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <span className="opacity-70 mr-1.5 font-bold">{stage.step}</span>
                    <span>{stage.tab}</span>
                  </button>
                ))}
              </div>

              <span className="hidden md:inline-block text-[11px] font-mono text-[var(--landing-text-muted)]">
                SCROLL TO TRANSFORM INTERFACE ↓
              </span>
            </div>

            {/* Progress bar scrub indicator */}
            <div className="w-full h-1 bg-[var(--landing-border)] mt-2 rounded-full overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-[var(--landing-primary)] origin-left scale-x-0"
              />
            </div>
          </div>

          {/* Transforming Workspace Component */}
          <div className="flex-1 w-full flex items-center justify-center min-h-0 drop-shadow-2xl">
            <WorkspaceDemo />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductStory;
