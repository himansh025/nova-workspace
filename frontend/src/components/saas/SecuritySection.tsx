"use client";

import React, { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { securityPillars } from "@/data/landing-content";
import { developerSectionData } from "@/data/features";
import { Shield, Key, FileCheck, Lock, Copy, Check } from "lucide-react";

export const SecuritySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const pillars = securityPillars;
  const currentCode = developerSectionData.codeTabs[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPillarIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Lock className="w-5 h-5 text-[var(--landing-primary)]" />;
      case 1:
        return <Key className="w-5 h-5 text-[#0EA5E9]" />;
      case 2:
        return <FileCheck className="w-5 h-5 text-[var(--landing-success)]" />;
      default:
        return <Shield className="w-5 h-5 text-[var(--landing-gold)]" />;
    }
  };

  return (
    <section
      id="security"
      className="section-spacing bg-[var(--landing-surface-muted)] text-[var(--landing-text)] border-t border-[var(--landing-border)]"
    >
      <div className="container-site px-4 sm:px-6 lg:px-8 space-y-24">
        {/* 21. DEVELOPER SECTION: BUILT FOR MODERN TEAMS */}
        <div>
          <div className="max-w-2xl mb-12">
            <Reveal>
              <SectionLabel tag="08">
                DEVELOPER PLATFORM
              </SectionLabel>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="section-title text-[var(--landing-text)] uppercase mt-4">
                BUILT FOR
                <br />
                <span className="text-[var(--landing-primary)]">MODERN TEAMS.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 text-base text-[var(--landing-text-muted)] leading-relaxed">
                Automate your squad&apos;s routine triage and sync workflows with our
                official TypeScript SDK, GraphQL API, and real-time event webhooks.
              </p>
            </Reveal>
          </div>

          {/* Premium Code Editor Visual */}
          <Reveal delay={0.25}>
            <div className="p-3 rounded-3xl bg-[var(--landing-surface)] border border-[var(--landing-border-strong)] shadow-xs">
              <div className="rounded-2xl border border-[var(--nova-border)] bg-[var(--nova-bg)] overflow-hidden shadow-xl">
                {/* Editor Tabs & Chrome */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--nova-bg)] border-b border-[var(--nova-border)] overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-3">
                      <span className="w-3 h-3 rounded-full bg-white/10" />
                      <span className="w-3 h-3 rounded-full bg-white/10" />
                      <span className="w-3 h-3 rounded-full bg-white/10" />
                    </div>
                    <div className="flex items-center gap-1">
                      {developerSectionData.codeTabs.map((tab, idx) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(idx)}
                          className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                            activeTab === idx
                              ? "bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] font-medium border border-[var(--landing-primary)]/30"
                              : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                {/* Code display area */}
                <div className="p-6 font-mono text-xs md:text-sm text-[var(--nova-text-primary)] overflow-x-auto leading-relaxed bg-[var(--nova-sidebar)]">
                  <pre>
                    <code>{currentCode.code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 22. SECURITY SECTION: SECURITY, BY DEFAULT */}
        <div>
          <div className="max-w-2xl mb-12">
            <Reveal>
              <SectionLabel tag="09">
                SECURITY ARCHITECTURE
              </SectionLabel>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="section-title text-[var(--landing-text)] uppercase mt-4">
                SECURITY,
                <br />
                <span className="text-[var(--landing-primary)]">BY DEFAULT.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-4 text-base text-[var(--landing-text-muted)] leading-relaxed">
                Engineered with strict isolation, granular access control, and
                tamper-evident audit logging.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pillars.map((pillar, idx) => (
              <Reveal key={pillar.title} delay={0.1 * idx}>
                <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] flex flex-col justify-between h-full shadow-xs">
                  <div>
                    <div className="mb-4">{getPillarIcon(idx)}</div>
                    <h3 className="text-base font-medium text-[var(--landing-text)] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-[var(--landing-text-muted)] leading-relaxed mb-6">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4 border-t border-[var(--landing-border-muted)]">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--landing-surface-muted)] text-[var(--landing-text-muted)] border border-[var(--landing-border)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
