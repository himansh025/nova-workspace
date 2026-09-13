"use client";

import React, { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { pricingPlans } from "@/data/pricing";
import { Check } from "lucide-react";

export const PricingSection: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section
      id="pricing"
      className="section-spacing bg-[var(--color-background)] border-t border-[var(--color-border)]"
    >
      <div className="container-site">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Reveal>
            <SectionLabel tag="10">EXAMPLE PRICING TIERS</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--color-foreground)] uppercase mt-4">
              INVEST IN
              <br />
              <span className="text-[var(--color-accent)]">TEAM VELOCITY.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--color-muted)] leading-relaxed">
              Transparent, predictable pricing designed for squads at any scale.
              No seat penalization. (Illustrative demonstration tiers).
            </p>
          </Reveal>

          {/* Billing Interval Toggle */}
          <Reveal delay={0.25}>
            <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs font-mono">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-1.5 rounded-full transition-all ${
                  !isAnnual
                    ? "bg-white text-[var(--color-foreground)] shadow-xs font-semibold"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  isAnnual
                    ? "bg-white text-[var(--color-foreground)] shadow-xs font-semibold"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <span>Annual</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
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
                  className={`rounded-2xl p-8 flex flex-col justify-between h-full transition-all duration-200 relative ${
                    plan.highlighted
                      ? "bg-[#0E1015] text-white border-2 border-[var(--color-accent)] shadow-xl"
                      : "bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-xs hover:border-[var(--color-border-strong)]"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6 bg-[var(--color-accent)] text-white text-[10px] font-mono font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-medium tracking-tight mb-2">
                      {plan.name}
                    </h3>
                    <p
                      className={`text-xs leading-relaxed mb-6 ${
                        plan.highlighted ? "text-neutral-400" : "text-[var(--color-muted)]"
                      }`}
                    >
                      {plan.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-4xl font-bold font-mono tracking-tight">
                        ${price}
                      </span>
                      <span
                        className={`text-xs font-mono ${
                          plan.highlighted ? "text-neutral-400" : "text-[var(--color-muted)]"
                        }`}
                      >
                        / member / month
                      </span>
                    </div>

                    <div className="space-y-3 mb-8">
                      <div
                        className={`text-[10px] font-mono uppercase tracking-wider ${
                          plan.highlighted ? "text-neutral-400" : "text-[var(--color-muted)]"
                        }`}
                      >
                        Included Capabilities:
                      </div>
                      {plan.features.map((feature, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2.5 text-xs">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              plan.highlighted
                                ? "text-[var(--color-accent)]"
                                : "text-[var(--color-accent)]"
                            }`}
                          />
                          <span
                            className={
                              plan.highlighted ? "text-neutral-300" : "text-[var(--color-foreground)]"
                            }
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant={plan.highlighted ? "secondary" : "outline"}
                    size="md"
                    className="w-full justify-center"
                  >
                    {plan.ctaText}
                  </Button>
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
