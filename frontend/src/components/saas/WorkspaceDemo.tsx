"use client";

import React from "react";
import Link from "next/link";
import Sidebar from "@/components/product-ui/Sidebar";
import TaskBoard from "@/components/product-ui/TaskBoard";
import AIPanel from "@/components/product-ui/AIPanel";
import Chart from "@/components/product-ui/Chart";
import ReleaseSummary from "@/components/product-ui/ReleaseSummary";
import { FileCode, GitFork, ShieldCheck } from "lucide-react";

interface WorkspaceDemoProps {
  currentStepIndex?: number;
}

export const WorkspaceDemo: React.FC<WorkspaceDemoProps> = () => {
  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col bg-[#0C0D11] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative">
      {/* Workspace App Shell Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0E1015] border-b border-white/10 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="ml-2 text-xs font-mono text-neutral-400">
            Nova Studio // Unified Project Lifecycle
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded hidden sm:inline">
            Project: Platform Core 2.0
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Link
            href="/app"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/40 text-[11px] font-medium text-white transition-colors"
          >
            <span>Launch Studio →</span>
          </Link>
        </div>
      </div>

      {/* Main Multi-Panel Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative bg-[#111216]">
        {/* Persistent Sidebar */}
        <Sidebar className="hidden lg:flex" activeItem="projects" />

        {/* Dynamic Interactive Stage Panels (Stacked and animated via GSAP) */}
        <div className="flex-1 relative overflow-hidden">
          {/* 1. PLAN PANEL (0-20%) */}
          <div
            id="story-panel-plan"
            data-story-panel="plan"
            className="absolute inset-0 p-6 flex flex-col bg-[#111216] overflow-y-auto no-scrollbar"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)]">
                  Step 01 • Architecture Specifications
                </span>
                <h3 className="text-lg font-medium text-white">
                  Technical Requirements & Dependency Graphs
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-mono text-xs border border-[var(--color-accent)]/30">
                SPEC ENGINE ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#161820] border border-white/5">
                <FileCode className="w-5 h-5 text-[var(--color-accent)] mb-2" />
                <div className="text-xs font-mono text-neutral-400">SPEC-104</div>
                <div className="text-sm font-medium text-white my-1">
                  CRDT Real-time State Sync
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Sub-50ms peer state propagation with deterministic vector clocks.
                </p>
                <div className="mt-3 text-[10px] font-mono text-emerald-400">
                  Status: Approved by Architecture Board
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#161820] border border-white/5">
                <GitFork className="w-5 h-5 text-sky-400 mb-2" />
                <div className="text-xs font-mono text-neutral-400">SPEC-105</div>
                <div className="text-sm font-medium text-white my-1">
                  Vector Memory Ingestion
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Continuous multi-repo git commit & pull request semantic embeddings.
                </p>
                <div className="mt-3 text-[10px] font-mono text-amber-400">
                  Status: PR Schema Under Review
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#161820] border border-white/5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
                <div className="text-xs font-mono text-neutral-400">SPEC-106</div>
                <div className="text-sm font-medium text-white my-1">
                  Zero-Downtime Migration
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Dual-write shadow pipeline for customer authentication tables.
                </p>
                <div className="mt-3 text-[10px] font-mono text-blue-400">
                  Status: Stage 1 Dry-Run Passed
                </div>
              </div>
            </div>
          </div>

          {/* 2. TASK / BUILD PANEL (20-45%) */}
          <div
            id="story-panel-task"
            data-story-panel="task"
            className="absolute inset-0 flex flex-col bg-[#111216] overflow-hidden"
          >
            <TaskBoard className="h-full" />
          </div>

          {/* 3. AI PANEL (45-70%) */}
          <div
            id="story-panel-ai"
            data-story-panel="ai"
            className="absolute inset-0 flex flex-col bg-[#0E1015] overflow-hidden"
          >
            <AIPanel className="h-full" />
          </div>

          {/* 4. INSIGHTS PANEL (70-90%) */}
          <div
            id="story-panel-insights"
            data-story-panel="insights"
            className="absolute inset-0 p-6 flex flex-col justify-center bg-[#111216] overflow-y-auto no-scrollbar"
          >
            <div className="mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Step 04 • Continuous Signals
              </span>
              <h3 className="text-lg font-medium text-white">
                Cycle Time & Engineering Throughput
              </h3>
            </div>
            <Chart isDark={true} />
          </div>

          {/* 5. RELEASE / SHIP PANEL (90-100%) */}
          <div
            id="story-panel-release"
            data-story-panel="release"
            className="absolute inset-0 p-6 flex flex-col justify-center bg-[#0C0D11] overflow-y-auto no-scrollbar"
          >
            <div className="mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                Step 05 • Production Release State
              </span>
              <h3 className="text-lg font-medium text-white">
                Zero-Friction Canary Promotion
              </h3>
            </div>
            <ReleaseSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDemo;
