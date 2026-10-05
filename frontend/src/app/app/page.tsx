"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  ArrowUpRight,
  Sparkles,
  Rocket,
  FileCode2,
  Plus,
} from "lucide-react";
import { Task, Spec, ActivityItem, Project, Release } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { OverviewSkeleton } from "@/components/workspace/Skeletons";
import { apiFetchInit } from "@/lib/apiHeaders";

export default function OverviewPage() {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, specsRes, actsRes, relRes] = await Promise.all([
        fetch("/api/projects", apiFetchInit()),
        fetch("/api/tasks", apiFetchInit()),
        fetch("/api/specs"),
        fetch("/api/activity"),
        fetch("/api/releases"),
      ]);

      const [projData, tasksData, specsData, actsData, relData] =
        await Promise.all([
          projRes.json(),
          tasksRes.json(),
          specsRes.json(),
          actsRes.json(),
          relRes.json(),
        ]);

      if (projData.projects) setProject(projData.projects[0]);
      if (tasksData.tasks) setTasks(tasksData.tasks);
      if (specsData.specs) setSpecs(specsData.specs);
      if (actsData.activities) setActivities(actsData.activities);
      if (relData.releases) setRelease(relData.releases[0]);
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    window.addEventListener("task-saved", fetchData);
    return () => window.removeEventListener("task-saved", fetchData);
  }, []);

  if (loading) {
    return <OverviewSkeleton />;
  }

  const urgentTasks = tasks.filter(
    (t) => t.priority === "urgent" && t.status !== "done"
  );
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const completionRate = Math.round(
    (doneTasks.length / (tasks.length || 1)) * 100
  );

  // Decorative sparkline bar heights for cycle time card
  const sparkBars = [40, 65, 52, 78, 60, 85, 70];

  /** Returns badge classes for a given task status */
  function statusBadge(status: string) {
    switch (status) {
      case "done":
        return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]";
      case "in_progress":
        return "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]";
      case "review":
        return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]";
      case "blocked":
      case "urgent":
        return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border border-[var(--nova-danger-border)]";
      default:
        return "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]";
    }
  }

  /** Returns badge classes for a spec status */
  function specStatusBadge(status: string) {
    if (status === "approved")
      return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]";
    return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]";
  }

  return (
    <div className="p-5 sm:p-6 lg:p-7 space-y-5 max-w-[1280px] mx-auto bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start gap-2 pb-5 border-b border-[var(--nova-border)]">
        {/* Left: workspace label + title + description */}
        <div>
          <div className="flex items-center gap-0 pl-2 border-l-2 border-[var(--nova-accent)]">
            <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--nova-accent)] font-medium">
              Active Workspace
            </span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-[var(--nova-text-primary)] mt-1.5">
            {project?.name ||
              (user?.organization
                ? `${user.organization} Workspace`
                : "My Workspace")}
          </h1>
          <p className="text-[12px] text-[var(--nova-text-secondary)] mt-1 max-w-xl">
            {project?.description ||
              "Collaborative engineering workspace — tasks, architecture specs, and live pipeline visibility."}
          </p>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/app/ai"
            className="bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] hover:opacity-90 rounded px-3 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors font-medium"
          >
            <Sparkles className="w-[14px] h-[14px] text-[var(--nova-ai)]" />
            Ask AI Copilot
          </Link>
          <Link
            href="/app/tasks"
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] rounded px-3 py-1.5 text-[12px] flex items-center gap-1.5 transition-colors"
          >
            Open Kanban
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Cycle Time */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[var(--nova-border-strong)] transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--nova-text-muted)]">
              Cycle Time
            </span>
            <Clock className="w-[14px] h-[14px] text-[var(--nova-info-text)]" />
          </div>
          <div className="text-[24px] font-semibold font-mono text-[var(--nova-text-primary)] tracking-tight leading-none">
            {project?.cycleTime || (tasks.length > 0 ? "1.4d" : "0.0d")}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-success)] shrink-0" />
            <span className="text-[12px] text-[var(--nova-success-text)] font-medium">
              {tasks.length > 0 ? "On schedule" : "Ready for tasks"}
            </span>
          </div>
          {/* Decorative sparkline bars */}
          <div className="flex items-end gap-[3px] h-5 pt-1">
            {sparkBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background:
                    i === sparkBars.length - 1
                      ? "var(--nova-success)"
                      : "var(--nova-info-text)",
                  opacity: i === sparkBars.length - 1 ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        </div>

        {/* Delivery Velocity */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[var(--nova-border-strong)] transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--nova-text-muted)]">
              Velocity
            </span>
            <TrendingUp className="w-[14px] h-[14px] text-[var(--nova-success)]" />
          </div>
          <div className="text-[24px] font-semibold font-mono text-[var(--nova-text-primary)] tracking-tight leading-none">
            {tasks.length > 0 ? "+12%" : "0 pts"}
          </div>
          <div className="text-[12px] text-[var(--nova-success-text)] font-medium">
            {tasks.length > 0 ? "Ahead of baseline" : "Baseline initializing"}
          </div>
          {/* Velocity percentage bar */}
          <div className="w-full bg-[var(--nova-border-muted)] rounded-full h-1 overflow-hidden">
            <div
              className="bg-[var(--nova-success)] h-full rounded-full transition-all duration-500"
              style={{ width: tasks.length > 0 ? "72%" : "0%" }}
            />
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[var(--nova-border-strong)] transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--nova-text-muted)]">
              Sprint Progress
            </span>
            <CheckCircle2 className="w-[14px] h-[14px] text-[var(--nova-accent)]" />
          </div>
          <div className="text-[24px] font-semibold font-mono text-[var(--nova-text-primary)] tracking-tight leading-none">
            {completionRate}%
          </div>
          <div className="w-full bg-[var(--nova-border-muted)] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--nova-accent)] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="text-[11px] text-[var(--nova-text-muted)] font-mono">
            {doneTasks.length} / {tasks.length} tasks done
          </div>
        </div>

        {/* Blockers */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-[var(--nova-border-strong)] transition-colors">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono uppercase tracking-[0.1em] text-[var(--nova-text-muted)]">
              Blockers
            </span>
            <AlertTriangle className="w-[14px] h-[14px] text-[var(--nova-warning)]" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[24px] font-semibold font-mono tracking-tight leading-none ${
                urgentTasks.length > 0
                  ? "text-[var(--nova-warning-text)]"
                  : "text-[var(--nova-text-muted)]"
              }`}
            >
              {urgentTasks.length}
            </span>
            {/* Pulsing dot when blockers exist */}
            {urgentTasks.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-[var(--nova-danger)] animate-pulse shrink-0" />
            )}
          </div>
          <div
            className={`text-[12px] font-medium ${
              urgentTasks.length > 0
                ? "text-[var(--nova-danger-text)]"
                : "text-[var(--nova-success-text)]"
            }`}
          >
            {urgentTasks.length > 0 ? "Requires attention" : "Clear"}
          </div>
        </div>
      </div>

      {/* ── Blocker Alert Banner (conditional) ───────────────────────────── */}
      {urgentTasks.length > 0 && (
        <div className="bg-[var(--nova-warning-subtle)] border border-[var(--nova-warning-border)] border-l-4 border-l-[var(--nova-warning)] rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[var(--nova-warning)] shrink-0 mt-0.5" />
            <div>
              <div className="text-[12px] font-semibold text-[var(--nova-warning-text)]">
                P0 Blockers Active ({urgentTasks.length})
              </div>
              <p className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5">
                {urgentTasks[0].key}: {urgentTasks[0].title} — Assigned to{" "}
                {urgentTasks[0].assignee.name}
              </p>
            </div>
          </div>
          <Link
            href="/app/tasks"
            className="bg-[var(--nova-warning-subtle)] border border-[var(--nova-warning-border)] text-[var(--nova-warning-text)] hover:opacity-90 rounded px-2.5 py-1 text-[11px] font-medium transition-colors shrink-0"
          >
            Review
          </Link>
        </div>
      )}

      {/* ── Main 2-Col Layout ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left span-2: In-Flight Tasks + Architecture Specs */}
        <div className="lg:col-span-2 space-y-5">
          {/* Active In-Flight Engineering */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg">
            {/* Panel header */}
            <div className="px-4 pt-4 pb-3 border-b border-[var(--nova-border-muted)] flex justify-between items-center">
              <div>
                <div className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Active In-Flight
                </div>
                <div className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
                  Tasks in development and code review
                </div>
              </div>
              <Link
                href="/app/tasks"
                className="text-[11px] text-[var(--nova-accent)] hover:text-[var(--nova-accent-hover)] transition-colors font-medium"
              >
                All {tasks.length} tasks →
              </Link>
            </div>

            {/* Task rows */}
            {tasks.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--nova-text-muted)] mb-2 opacity-50" />
                <div className="text-[12px] font-semibold text-[var(--nova-text-primary)]">
                  No active engineering tasks yet
                </div>
                <p className="text-[11px] text-[var(--nova-text-secondary)] mt-1 max-w-xs">
                  Get started by creating your first task or managing backlog
                  items in Kanban.
                </p>
                <Link
                  href="/app/tasks"
                  className="mt-3 inline-flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Task
                </Link>
              </div>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href="/app/tasks"
                  className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--nova-border-muted)] last:border-0 hover:bg-[var(--nova-deep)] transition-colors cursor-pointer group"
                >
                  {/* Left: task key + title */}
                  <div className="flex items-center min-w-0">
                    <span className="text-[10px] font-mono text-[var(--nova-accent)] shrink-0">
                      {task.key}
                    </span>
                    <span className="text-[12px] text-[var(--nova-text-primary)] ml-2.5 truncate">
                      {task.title}
                    </span>
                  </div>

                  {/* Right: branch + status badge + avatar */}
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {task.branch && (
                      <span className="text-[10px] font-mono text-[var(--nova-text-secondary)] bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] px-1.5 py-0.5 rounded flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-[var(--nova-info-text)]" />
                        <span className="truncate max-w-[90px]">
                          {task.branch}
                        </span>
                      </span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusBadge(task.status)}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    {/* Assignee avatar */}
                    <div className="w-[22px] h-[22px] rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border)] flex items-center justify-center text-[9px] font-bold text-[var(--nova-text-secondary)]">
                      {task.assignee.initials}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Architecture Specifications */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg">
            {/* Panel header */}
            <div className="px-4 pt-4 pb-3 border-b border-[var(--nova-border-muted)] flex justify-between items-center">
              <div>
                <div className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Architecture Specifications
                </div>
                <div className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
                  Technical requirements and system design plans
                </div>
              </div>
              <Link
                href="/app/specs"
                className="text-[11px] text-[var(--nova-accent)] hover:text-[var(--nova-accent-hover)] transition-colors font-medium"
              >
                View all specs →
              </Link>
            </div>

            {/* Spec grid */}
            {specs.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
                <FileCode2 className="w-8 h-8 text-[var(--nova-text-muted)] mb-2 opacity-50" />
                <div className="text-[12px] font-semibold text-[var(--nova-text-primary)]">
                  No architecture specifications drafted
                </div>
                <p className="text-[11px] text-[var(--nova-text-secondary)] mt-1 max-w-xs">
                  Draft technical specs, RFCs, and system architecture plans
                  with AI co-drafting.
                </p>
                <Link
                  href="/app/specs"
                  className="mt-3 inline-flex items-center gap-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] rounded px-3 py-1.5 text-[12px] font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Draft First Spec
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {specs.map((spec, idx) => (
                  <Link
                    key={spec.id}
                    href="/app/specs"
                    className={`p-3.5 hover:bg-[var(--nova-deep)] transition-colors border-b border-[var(--nova-border-muted)] ${
                      /* Remove right border from last in row; keep for others */
                      (idx + 1) % 3 !== 0
                        ? "border-r border-[var(--nova-border-muted)]"
                        : ""
                    }`}
                  >
                    {/* Spec key + status badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[var(--nova-accent)]">
                        {spec.key}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${specStatusBadge(spec.status)}`}
                      >
                        {spec.status}
                      </span>
                    </div>
                    <h4 className="text-[12px] font-medium text-[var(--nova-text-primary)] mt-1 line-clamp-1">
                      {spec.title}
                    </h4>
                    <p className="text-[11px] text-[var(--nova-text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                      {spec.summary}
                    </p>
                    {/* Footer */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--nova-text-muted)] pt-2 mt-2 border-t border-[var(--nova-border-muted)]">
                      <span>Author: {spec.author.name.split(" ")[0]}</span>
                      <span>Spec Engine</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Canary Release */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[var(--nova-success)]" />
                <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Canary Release
                </span>
              </div>
              {/* Version badge */}
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]">
                {release?.version || "v1.0.0"}
              </span>
            </div>

            {/* Canary traffic section */}
            <div className="bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] rounded-md p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--nova-text-secondary)]">
                  Canary Traffic
                </span>
                <span className="text-[12px] font-semibold font-mono text-[var(--nova-text-primary)]">
                  {release ? `${release.canaryPercentage}%` : "Ready"}
                </span>
              </div>
              <div className="w-full bg-[var(--nova-border-muted)] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[var(--nova-success)] h-full rounded-full transition-all duration-500"
                  style={{ width: `${release?.canaryPercentage || 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--nova-text-muted)]">
                  Checks: {release?.checksPassed || 0}/
                  {release?.totalChecks || 0} passed
                </span>
                <span className="text-[var(--nova-success-text)] font-medium">Pipeline Ready</span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/app/releases"
              className="w-full flex items-center justify-center gap-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:border-[var(--nova-border-strong)] rounded px-3 py-1.5 text-[12px] transition-colors"
            >
              Manage Pipeline →
            </Link>
          </div>

          {/* Live Activity Stream */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-[var(--nova-border-muted)] flex justify-between items-center">
              <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                Live Activity
              </span>
              <span className="w-2 h-2 rounded-full bg-[var(--nova-success)] animate-pulse" />
            </div>

            {/* Activity items */}
            {activities.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[12px] text-[var(--nova-text-secondary)]">
                  No activity yet. Actions and updates will stream here in
                  real-time.
                </p>
              </div>
            ) : (
              activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="px-4 py-2.5 flex items-start gap-2.5 border-b border-[var(--nova-border-muted)] last:border-0"
                >
                  {/* Avatar */}
                  <div className="w-[20px] h-[20px] rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] flex items-center justify-center text-[9px] font-bold text-[var(--nova-text-secondary)] shrink-0 mt-0.5">
                    {act.actor.initials}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-snug">
                      <span className="font-medium text-[var(--nova-text-primary)]">
                        {act.actor.name}
                      </span>{" "}
                      <span className="text-[var(--nova-text-secondary)]">{act.action}</span>{" "}
                      <span className="text-[var(--nova-accent)] font-medium">{act.target}</span>
                    </p>
                    <span className="text-[10px] font-mono text-[var(--nova-text-muted)] mt-0.5 block">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
