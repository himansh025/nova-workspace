"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import ProductPreview from "./ProductPreview";
import { initGsap, gsap } from "@/lib/animations/gsap";
import { animateHeroLoad, prefersReducedMotion } from "@/lib/animations/reveal";
import { Play, ArrowRight } from "lucide-react";

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
      className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden bg-[var(--landing-bg)] tech-grid"
    >
      <div className="container-site flex flex-col items-center text-center">


        {/* Hero Heading: Strong charcoal typography, warm terracotta accent phrase */}
        <h1
          ref={headlineRef}
          data-hero-headline
          className="hero-title text-[var(--landing-text)] max-w-4xl tracking-tight uppercase"
        >
          BUILD WHAT
          <br />
          <span className="text-[var(--landing-primary)]">
            MATTERS.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p
          ref={subRef}
          data-hero-sub
          className="mt-6 text-base md:text-xl text-[var(--landing-text-muted)] max-w-2xl font-normal leading-relaxed"
        >
          NOVA brings planning, AI-assisted execution, and product intelligence
          into one focused workspace built for engineering velocity.
        </p>

        {/* Action CTAs */}
        <div
          ref={ctaRef}
          data-hero-cta
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 text-base px-6.5 py-3.5 rounded-xl bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white shadow-xs active:scale-[0.99]"
          >
            <span>START BUILDING</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="#product-story"
            className="inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 text-base px-6.5 py-3.5 rounded-xl bg-[var(--landing-surface)] border border-[var(--landing-border)] text-[var(--landing-text)] hover:bg-[var(--landing-surface-muted)] active:scale-[0.99]"
          >
            <Play className="w-4 h-4 fill-current text-[var(--landing-text-muted)]" />
            <span>WATCH DEMO</span>
          </Link>
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
