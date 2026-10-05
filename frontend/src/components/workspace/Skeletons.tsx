"use client";

import React from "react";
import { Kanban, List, Plus, Search } from "lucide-react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base atomic skeleton block with shimmer animation calibrated for light theme.
 */
export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={`skeleton-shimmer bg-[rgba(0,0,0,0.06)] rounded-md ${className}`}
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
    {
      key: "backlog",
      title: "Backlog",
      count: 1,
      dot: "bg-[var(--nova-text-muted)]",
      tasks: [
        {
          key: "NV-893",
          titleWidth: "w-52",
          statusBg: "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]",
          statusText: "Backlog",
          assignee: "HS",
        },
      ],
    },
    {
      key: "todo",
      title: "To Do",
      count: 0,
      dot: "bg-[var(--nova-accent)]",
      tasks: [],
    },
    {
      key: "in_progress",
      title: "In Progress",
      count: 1,
      dot: "bg-[var(--nova-info)]",
      tasks: [
        {
          key: "NV-889",
          titleWidth: "w-48",
          statusBg: "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]",
          statusText: "In Prog",
          assignee: "HS",
        },
      ],
    },
    {
      key: "review",
      title: "In Review",
      count: 1,
      dot: "bg-[var(--nova-warning)]",
      tasks: [
        {
          key: "NV-888",
          titleWidth: "w-56",
          statusBg: "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]",
          statusText: "Review",
          assignee: "HS",
        },
      ],
    },
    {
      key: "done",
      title: "Done",
      count: 10,
      dot: "bg-[var(--nova-success)]",
      tasks: [
        {
          key: "NV-887",
          titleWidth: "w-44",
          statusBg: "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]",
          statusText: "Done",
          assignee: null,
        },
        {
          key: "NV-892",
          titleWidth: "w-52",
          statusBg: "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]",
          statusText: "Done",
          assignee: null,
        },
        {
          key: "NV-890",
          titleWidth: "w-48",
          statusBg: "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]",
          statusText: "Done",
          assignee: null,
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-center justify-between gap-3 shrink-0">
        <div className="flex flex-col">
          <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)] leading-none">
            Tasks &amp; Board
          </h1>
          <span className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
            Sprint 48 Active Cycle · Drag or update status across columns
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded p-0.5 flex gap-0.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium bg-[var(--nova-surface)] text-[var(--nova-text-primary)] shadow-xs">
              <Kanban className="w-3 h-3" />
              <span>Kanban</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium text-[var(--nova-text-muted)]">
              <List className="w-3 h-3" />
              <span>List</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] text-white rounded text-[12px] font-medium opacity-90">
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </div>
        </div>
      </div>

      {/* ── Filter row ────────────────────────────────────────────────────── */}
      <div className="px-5 py-2.5 bg-[var(--nova-bg)] border-b border-[var(--nova-border-muted)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-2xl">
          <Search className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-3 py-1.5 text-[12px] text-[var(--nova-text-muted)] w-full h-8 flex items-center">
            Search issues by key, title, or branch...
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] flex items-center">
            All Projects
          </div>
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] flex items-center">
            All Priorities
          </div>
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] flex items-center">
            All Engineers
          </div>
          <div className="text-[10px] text-[var(--nova-text-muted)] font-mono pl-2 border-l border-[var(--nova-border)] flex items-center">
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
      </div>

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full px-5 py-4 items-start min-w-max">
            {columns.map((col) => (
              <div
                key={col.key}
                className="w-72 shrink-0 flex flex-col rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs overflow-hidden"
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--nova-border-muted)] bg-[var(--nova-surface)]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    <span className="text-[12px] font-semibold text-[var(--nova-text-primary)]">
                      {col.title}
                    </span>
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)] leading-none">
                      {col.count}
                    </span>
                  </div>
                  <div className="text-[var(--nova-text-muted)] p-0.5">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Column cards container */}
                <div className="p-2 space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto no-scrollbar">
                  {col.tasks.length === 0 ? (
                    <div className="border-2 border-dashed border-[var(--nova-border)] rounded-xl p-4 text-center text-[11px] text-[var(--nova-text-placeholder)]">
                      Drag issues here
                    </div>
                  ) : (
                    col.tasks.map((task, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border bg-[var(--nova-bg)] border-[var(--nova-border)] space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-semibold text-[var(--nova-accent)]">
                            {task.key}
                          </span>
                          <span className="text-[10px] text-[var(--nova-text-muted)]">→</span>
                        </div>
                        <div className="space-y-1">
                          <Skeleton className={`h-3.5 ${task.titleWidth}`} />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${task.statusBg}`}>
                            {task.statusText}
                          </span>
                          {task.assignee ? (
                            <div className="w-4 h-4 rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[8px] font-bold text-[var(--nova-accent)]">
                              {task.assignee}
                            </div>
                          ) : (
                            <Skeleton className="w-4 h-4 rounded-full" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
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
 * Overview / Dashboard Skeleton
 */
export function OverviewSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--nova-border)]">
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
          <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-3 shadow-xs">
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
        <div className="lg:col-span-2 p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
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

        <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)]">
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
    <div className="flex-1 bg-[var(--nova-bg)] text-[var(--nova-text-primary)] flex flex-col overflow-y-auto no-scrollbar animate-fadeIn">
      {/* Top Banner Header */}
      <div className="border-b border-[var(--nova-border)] bg-[var(--nova-surface)] px-6 py-5">
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
            <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-2 shadow-xs">
              <div className="text-[11px] font-mono text-[var(--nova-text-secondary)] uppercase tracking-wider">
                {title}
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>

        {/* Interactive Burndown Chart Card */}
        <div className="p-5 rounded-2xl bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-4">
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
          <div className="relative w-full h-56 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] p-4 flex flex-col justify-between overflow-hidden">
            <div className="space-y-8">
              <Skeleton className="h-px w-full bg-[var(--nova-border)]" />
              <Skeleton className="h-px w-full bg-[var(--nova-border)]" />
              <Skeleton className="h-px w-full bg-[var(--nova-border)]" />
              <Skeleton className="h-px w-full bg-[var(--nova-border)]" />
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
          <div className="p-5 rounded-2xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
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
          <div className="p-5 rounded-2xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--nova-border)]">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
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
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] animate-fadeIn">
      {/* Top Header */}
      <div className="p-4 sm:px-6 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
          <Skeleton className="h-3.5 w-80" />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 p-0.5 bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg">
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--nova-border)]">
        {/* Left: PR List */}
        <div className="w-full lg:w-96 shrink-0 p-3 space-y-2 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center justify-between pt-1 border-t border-[var(--nova-border)]">
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
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] animate-fadeIn">
      {/* Top Bar */}
      <div className="p-4 sm:px-6 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
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
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--nova-border)]">
        {/* Left: Spec List */}
        <div className="w-full lg:w-80 shrink-0 p-3 space-y-2 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-2 shadow-xs">
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[var(--nova-text-primary)] animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)]">
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
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-6 shadow-xs">
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
          <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] flex items-center justify-between shadow-xs">
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[var(--nova-text-primary)] animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)]">
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
          <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] flex items-center gap-3 shadow-xs">
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[var(--nova-text-primary)] animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)]">
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
          <div key={i} className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--nova-border)]">
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
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] animate-fadeIn">
      {/* Top Header & Stats Bar */}
      <div className="p-4 sm:px-6 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex flex-col gap-4 shrink-0">
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
            <div key={i} className="p-3 rounded-xl bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--nova-border)]">
        {/* Left: Service Nodes */}
        <div className="w-full lg:w-96 shrink-0 p-4 space-y-3 overflow-y-auto">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-2 shadow-xs">
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-[var(--nova-text-primary)] animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)]">
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
          <div key={i} className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-3 shadow-xs">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart Canvas Card */}
      <div className="p-6 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
