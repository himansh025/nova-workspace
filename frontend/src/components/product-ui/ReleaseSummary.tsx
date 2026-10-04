"use client";

import React, { useState } from "react";
import { CheckCircle2, Rocket, FileText } from "lucide-react";
import Button from "@/components/ui/Button";

interface ReleaseSummaryProps {
  className?: string;
}

export const ReleaseSummary: React.FC<ReleaseSummaryProps> = ({ className = "" }) => {
  const [promoted, setPromoted] = useState(false);

  const checks = [
    { title: "Zero-downtime DB migration dry-run", status: "passed", latency: "14ms" },
    { title: "End-to-End integration suite (142 tests)", status: "passed", latency: "1m 12s" },
    { title: "Edge vector search schema parity", status: "passed", latency: "42ms" },
    { title: "AI-generated release notes verified", status: "passed", latency: "synced" }
  ];

  return (
    <div
      className={`bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-xl p-6 text-[var(--nova-text-primary)] select-none ${className}`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[var(--nova-border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--landing-success-subtle)] text-[var(--landing-success)] border border-[var(--landing-success)]/30 font-semibold">
              READY FOR DEPLOYMENT
            </span>
            <span className="text-xs font-mono text-neutral-400">Release Candidate</span>
          </div>
          <h3 className="text-xl font-medium tracking-tight">
            NOVA Core v2.4.0-production
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setPromoted(true)}
            disabled={promoted}
          >
            <Rocket className="w-3.5 h-3.5 mr-1.5" />
            <span>{promoted ? "Promoted to 100% Live" : "Promote to 100% Traffic"}</span>
          </Button>
        </div>
      </div>

      {/* Grid of checks and rollout status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
        {/* Left: Pre-flight Verification Checklist */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
            Pre-flight Verifications (4/4 Passed)
          </div>
          {checks.map((check, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-[var(--nova-border-muted)] text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--landing-success)] shrink-0" />
                <span className="text-neutral-200">{check.title}</span>
              </div>
              <span className="font-mono text-[10px] text-neutral-500">
                {check.latency}
              </span>
            </div>
          ))}
        </div>

        {/* Right: Canary traffic rollout gauge & Changelog */}
        <div className="bg-[var(--nova-elevated)] rounded-lg border border-[var(--nova-border-muted)] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
              <span>CANARY TRAFFIC ROLLOUT</span>
              <span className="text-[var(--landing-success)] font-semibold">
                {promoted ? "100% TRAFFIC" : "25% CANARY HEALTHY"}
              </span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-success)] transition-all duration-700"
                style={{ width: promoted ? "100%" : "25%" }}
              />
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Target latency p99 is 14ms across 12 global edge regions. Zero error
              spikes detected since canary cutover.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--nova-border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[var(--nova-text-primary)]">
              <FileText className="w-3.5 h-3.5 text-[var(--landing-primary)]" />
              <span>Changelog Published</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">
              commit 4f81c9a
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseSummary;
