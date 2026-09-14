"use client";

import React, { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import ProductPreview from "./ProductPreview";
import { initGsap, gsap } from "@/lib/animations/gsap";
import { animateHeroLoad, prefersReducedMotion } from "@/lib/animations/reveal";
import { Play } from "lucide-react";

export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGsap();

    const ctx = gsap.context(() => {
      // 1. Initial on-load choreography
      animateHeroLoad(
        headlineRef.current,
        subRef.current,
        ctaRef.current,
        previewWrapperRef.current
      );

      // 2. Scroll-driven elevation of product UI
      if (!prefersReducedMotion() && previewWrapperRef.current && containerRef.current) {
        gsap.to(previewWrapperRef.current, {
          y: -40,
          scale: 1.02,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1.2
          }
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden bg-[var(--color-background)] tech-grid"
    >
      <div className="container-site flex flex-col items-center text-center">
        {/* Subtle Tech Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--color-border)] text-xs font-mono text-[var(--color-foreground)] mb-6 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span>NOVA 2.0 WORKSPACE ARCHITECTURE</span>
        </div>

        {/* Hero Heading: Large, tight, confident clamp(52px, 7vw, 108px) */}
        <h1
          ref={headlineRef}
          data-hero-headline
          className="hero-title text-[var(--color-foreground)] max-w-4xl tracking-tight uppercase"
        >
          BUILD WHAT
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-foreground)] via-[var(--color-foreground)] to-[var(--color-accent)]">
            MATTERS.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p
          ref={subRef}
          data-hero-sub
          className="mt-6 text-base md:text-xl text-[var(--color-muted)] max-w-2xl font-normal leading-relaxed"
        >
          NOVA brings planning, AI-assisted execution, and product intelligence
          into one focused workspace.
        </p>

        {/* Action CTAs */}
        <div
          ref={ctaRef}
          data-hero-cta
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Button href="/app" variant="primary" size="lg" withArrow>
            START BUILDING
          </Button>
          <Button
            href="#product-story"
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>WATCH DEMO</span>
          </Button>
        </div>

        {/* Product Interface Preview */}
        <div
          ref={previewWrapperRef}
          data-hero-preview
          className="w-full max-w-6xl mt-14 md:mt-20 perspective-[1000px]"
        >
          <ProductPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
