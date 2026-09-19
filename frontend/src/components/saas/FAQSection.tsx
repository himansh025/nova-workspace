"use client";

import React, { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { faqList } from "@/data/faq";
import { ChevronDown } from "lucide-react";

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section
      id="faq"
      className="section-spacing bg-[var(--color-surface)] border-t border-[var(--color-border)]"
    >
      <div className="container-site">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <Reveal>
            <SectionLabel tag="11">QUESTIONS & ANSWERS</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--color-foreground)] uppercase mt-4">
              FREQUENTLY ASKED
              <br />
              <span className="text-[var(--color-accent)]">QUESTIONS.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--color-muted)] leading-relaxed">
              Clear answers to common questions about NOVA Workspace, architectural
              context, and security boundaries.
            </p>
          </Reveal>
        </div>

        {/* Accordion list */}
        <div className="max-w-3xl mx-auto divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          {faqList.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={item.id} delay={0.05 * idx}>
                <div className="py-5">
                  <button
                    onClick={() => toggle(idx)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between text-left group gap-4 cursor-pointer focus-visible:outline-none"
                  >
                    <span className="text-base md:text-lg font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--color-muted)] transition-transform duration-200 shrink-0 ${
                        isOpen ? "rotate-180 text-[var(--color-accent)]" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-3 pr-8 text-sm text-[var(--color-muted)] leading-relaxed animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
