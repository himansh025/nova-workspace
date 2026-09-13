import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { defaultThemeSchema } from "@/theme.schema";

export const WorkflowSection: React.FC = () => {
  const steps = defaultThemeSchema.workflow.steps;

  return (
    <section
      id="workflow"
      className="section-spacing bg-[var(--color-surface)] border-t border-[var(--color-border)] overflow-hidden"
    >
      <div className="container-site">
        <div className="max-w-2xl mb-16">
          <Reveal>
            <SectionLabel tag="04">ENGINEERING CADENCE</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--color-foreground)] uppercase mt-4">
              FROM IDEA
              <br />
              <span className="text-[var(--color-accent)]">TO SHIPPED.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--color-muted)] leading-relaxed">
              A continuous, frictionless progression. NOVA eliminates context
              switching between issue tracking, specification authoring, and
              production releases.
            </p>
          </Reveal>
        </div>

        {/* 4-Step Editorial Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <Reveal key={step.number} delay={0.15 * idx}>
              <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] hover:border-[var(--color-border-strong)] transition-all duration-200 flex flex-col justify-between h-full group hover:shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-mono font-semibold text-[var(--color-foreground)]">
                      {step.number}
                    </span>
                    <span className="text-xs font-mono tracking-widest text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                      PHASE
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-2 uppercase tracking-tight">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[var(--color-muted)] leading-relaxed mb-6">
                    {step.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
                  {step.details.map((detail, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex items-center gap-2 text-[11px] text-[var(--color-muted)]"
                    >
                      <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;
