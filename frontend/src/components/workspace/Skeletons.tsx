"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base atomic skeleton block with shimmer animation.
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`skeleton-shimmer rounded-md ${className}`}
      {...props}
    />
  );
}

/**
 * Kanban Board Skeleton
 * 1:1 replica of the Tasks & Board Kanban layout.
 */
export function KanbanSkeleton() {
  const columns = [
    { title: "BACKLOG", dot: "bg-neutral-400" },
    { title: "IN PROGRESS", dot: "bg-sky-400" },
    { title: "IN REVIEW", dot: "bg-amber-400" },
    { title: "DONE", dot: "bg-emerald-400" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200 animate-fadeIn">
      {/* Top Controls Header */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
          <Skeleton className="h-3.5 w-64" />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Skeleton className="h-8 w-36 sm:w-48" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* 4-Column Board Grid */}
      <div className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start min-w-[900px]">
          {columns.map((col) => (
            <div
              key={col.title}
              className="flex flex-col rounded-xl bg-[#14161D]/80 border border-white/10 p-3 min-h-[560px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot} opacity-60 animate-pulse`} />
                  <span className="text-xs font-mono font-semibold text-neutral-400 tracking-wider">
                    {col.title}
                  </span>
                  <Skeleton className="h-4 w-6 rounded-full" />
                </div>
                <Skeleton className="h-4 w-4 rounded" />
              </div>

              {/* Task Cards */}
              <div className="space-y-3">
                {[0, 1, 2].map((cardIdx) => (
                  <div
                    key={cardIdx}
                    className="p-3.5 rounded-lg bg-[#1B1E28] border border-white/5 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>

                    <div className="space-y-1.5">
                      <Skeleton className={`h-4 ${cardIdx % 2 === 0 ? "w-11/12" : "w-4/5"}`} />
                      <Skeleton className="h-3.5 w-3/5" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-3.5 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Overview / Dashboard Skeleton
 */
export function OverviewSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* 2-Column Split: Active Sprint + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>

        <div className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#1B1E28]/50">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Sprint Workspace Skeleton
 * 1:1 replica of the Sprints page (banner, 5 KPI strip cards, burndown chart, task columns).
 */
export function SprintSkeleton() {
  return (
    <div className="flex-1 bg-[#0B0C0E] text-white flex flex-col overflow-y-auto no-scrollbar animate-fadeIn">
      {/* Top Banner Header */}
      <div className="border-b border-white/10 bg-[#101216] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-60" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* 5-Column KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            "Total Committed",
            "Burned / Done",
            "Remaining Scope",
            "Team Velocity",
            "Burndown Pace"
          ].map((title, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#12141A] border border-white/5 space-y-2">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                {title}
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Interactive Burndown Chart Card */}
        <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-52" />
                <Skeleton className="h-4 w-28 rounded" />
              </div>
              <Skeleton className="h-3 w-72" />
            </div>

            {/* Legend Skeletons */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          </div>

          {/* SVG Canvas Shimmer Placeholder */}
          <div className="relative w-full h-56 rounded-xl bg-[#0E1015]/60 border border-white/5 p-4 flex flex-col justify-between overflow-hidden">
            <div className="space-y-8">
              <Skeleton className="h-px w-full bg-white/5" />
              <Skeleton className="h-px w-full bg-white/5" />
              <Skeleton className="h-px w-full bg-white/5" />
              <Skeleton className="h-px w-full bg-white/5" />
            </div>
            {/* Shimmering diagonal trajectory guideline */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Skeleton className="h-2 w-3/4 -rotate-12 rounded-full opacity-40" />
            </div>
          </div>
        </div>

        {/* Dual Columns: Active Sprint Scope vs Backlog Grooming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#181B22] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2 */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#181B22] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pull Requests Skeleton
 * Split screen replica of PR list and Git Diff viewer.
 */
export function PullRequestsSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200 animate-fadeIn">
      {/* Top Header */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80" />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-0.5 bg-[#161820] border border-white/10 rounded-lg">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left: PR List */}
        <div className="w-full lg:w-96 shrink-0 p-3 space-y-2 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#161822] border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: PR Detail & Review Diff */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>

          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Specs Skeleton
 * Split screen replica of architecture specifications and markdown editor.
 */
export function SpecsSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200 animate-fadeIn">
      {/* Top Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80" />
        </div>

        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-44 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left: Spec List */}
        <div className="w-full lg:w-80 shrink-0 p-3 space-y-2 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#161822] border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>

        {/* Right: Spec Editor Panel */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-36 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="space-y-2.5 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Releases & Canary Skeleton
 */
export function ReleasesSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80" />
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-md" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>
      </div>

      {/* Main Release Status Card */}
      <div className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
          <Skeleton className="h-8 w-36" />
        </div>

        {/* Canary Progress Bar & Stats */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>

      {/* Pre-flight Checks Checklist */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-[#14161D] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Team Directory Skeleton
 */
export function TeamSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-[#14161D] border border-white/10 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Projects Skeleton
 */
export function ProjectsSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <Skeleton className="h-3.5 w-64" />
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Architecture / Service Mesh Skeleton
 */
export function MeshSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#0A0B0D] text-neutral-200 animate-fadeIn">
      {/* Top Header & Stats Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-3.5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-[#14161D] border border-white/5 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left: Service Nodes */}
        <div className="w-full lg:w-96 shrink-0 p-4 space-y-3 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        {/* Right: Topology Canvas */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Insights & Telemetry Skeleton
 */
export function InsightsSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-32 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80" />
        </div>
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart Canvas Card */}
      <div className="p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
