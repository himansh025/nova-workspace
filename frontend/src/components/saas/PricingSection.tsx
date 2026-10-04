"use client";

import React, { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import Link from "next/link";
import { pricingPlans } from "@/data/pricing";
import { Check } from "lucide-react";

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="section-spacing bg-[var(--landing-bg)] border-t border-[var(--landing-border)]"
    >
      <div className="container-site">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Reveal>
            <SectionLabel tag="10">EXAMPLE PRICING TIERS</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--landing-text)] uppercase mt-4">
              INVEST IN
              <br />
              <span className="text-[var(--landing-primary)]">TEAM VELOCITY.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--landing-text-muted)] leading-relaxed">
              Transparent, predictable pricing designed for squads at any scale.
              No seat penalization. (Illustrative demonstration tiers).
            </p>
          </Reveal>

          {/* Billing Interval Toggle */}
          <Reveal delay={0.25}>
            <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-[var(--landing-surface-muted)] border border-[var(--landing-border)] text-xs font-mono">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                  !isAnnual
                    ? "bg-white text-[var(--landing-text)] shadow-xs font-semibold"
                    : "text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAnnual
                    ? "bg-white text-[var(--landing-text)] shadow-xs font-semibold"
                    : "text-[var(--landing-text-muted)] hover:text-[var(--landing-text)]"
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[var(--landing-success-subtle)] text-[var(--landing-success)] font-bold">
                  SAVE 20%
                </span>
              </button>
            </div>
          </Reveal>
        </div>

        {/* 3 Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, idx) => {
            const price = isAnnual ? plan.priceYearly : plan.priceMonthly;
            return (
              <Reveal key={plan.id} delay={0.1 * idx}>
                <div
                  className={`rounded-2xl p-8 flex flex-col justify-between h-full transition-all duration-200 relative bg-[var(--landing-surface)] text-[var(--landing-text)] ${
                    plan.highlighted
                      ? "border-2 border-[var(--landing-primary)] shadow-md"
                      : "border border-[var(--landing-border)] shadow-xs hover:border-[var(--landing-border-strong)]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6 bg-[var(--landing-primary)] text-white text-[10px] font-mono font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-medium tracking-tight mb-2 text-[var(--landing-text)]">
                      {plan.name}
                    </h3>
                    <p className="text-xs leading-relaxed mb-6 text-[var(--landing-text-muted)]">
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-bold font-mono tracking-tight text-[var(--landing-text)]">
                        ${price}
                      </span>
                      <span className="text-xs font-mono text-[var(--landing-text-muted)]">
                        / member / month
                      </span>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--landing-text-muted)]">
                        Included Capabilities:
                      </div>
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[var(--landing-primary)]" />
                          <span className="text-[var(--landing-text)]">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/app"
                    className={`w-full py-2.5 rounded-xl text-center text-xs font-semibold transition-all duration-150 block ${
                      plan.highlighted
                        ? "bg-[var(--landing-primary)] hover:bg-[var(--landing-primary-hover)] text-white shadow-xs"
                        : "bg-[var(--landing-surface)] border border-[var(--landing-border)] text-[var(--landing-text)] hover:bg-[var(--landing-surface-muted)]"
                    }`}
                  >
                    {plan.ctaText}
                  </Link>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
