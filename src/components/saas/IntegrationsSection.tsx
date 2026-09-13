"use client";

import React from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { integrationsList } from "@/data/integrations";
import {
  GitPullRequest,
  Layers,
  FileText,
  MessageSquare,
  Cloud,
  BarChart3,
  ArrowUpRight
} from "lucide-react";

export const IntegrationsSection: React.FC = () => {
  const getIcon = (id: string) => {
    switch (id) {
      case "git":
        return <GitPullRequest className="w-5 h-5" />;
      case "design":
        return <Layers className="w-5 h-5" />;
      case "docs":
        return <FileText className="w-5 h-5" />;
      case "slack":
        return <MessageSquare className="w-5 h-5" />;
      case "cloud":
        return <Cloud className="w-5 h-5" />;
      default:
        return <BarChart3 className="w-5 h-5" />;
    }
  };

  return (
    <section
      id="integrations"
      className="section-spacing bg-[var(--color-background)] border-t border-[var(--color-border)]"
    >
      <div className="container-site">
        <div className="max-w-2xl mb-16">
          <Reveal>
            <SectionLabel tag="06">ECOSYSTEM & STACK</SectionLabel>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="section-title text-[var(--color-foreground)] uppercase mt-4">
              WORKS WITH
              <br />
              <span className="text-[var(--color-accent)]">YOUR STACK.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-4 text-base text-[var(--color-muted)] leading-relaxed">
              Seamless bidirectional sync with your source repositories, design
              libraries, documentation, and cloud deployment pipelines.
            </p>
          </Reveal>
        </div>

        {/* 6 Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationsList.map((tool, idx) => (
            <Reveal key={tool.id} delay={0.08 * idx}>
              <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] transition-all duration-200 flex flex-col justify-between group hover:shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-foreground)] flex items-center justify-center group-hover:bg-[var(--color-accent-subtle)] group-hover:text-[var(--color-accent)] transition-colors">
                      {getIcon(tool.id)}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-surface-muted)] text-[var(--color-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-medium text-[var(--color-foreground)] mb-1 flex items-center gap-1.5">
                    <span>{tool.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>

                  <div className="text-[11px] font-mono text-[var(--color-muted)] mb-3">
                    {tool.category}
                  </div>

                  <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
