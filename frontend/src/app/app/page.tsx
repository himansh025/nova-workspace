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
  ShieldCheck,
  FileCode2,
  Plus
} from "lucide-react";
import { Task, Spec, ActivityItem, Project, Release } from "@/types";

export default function OverviewPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [projRes, tasksRes, specsRes, actsRes, relRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/tasks"),
        fetch("/api/specs"),
        fetch("/api/activity"),
        fetch("/api/releases")
      ]);

      const [projData, tasksData, specsData, actsData, relData] = await Promise.all([
        projRes.json(),
        tasksRes.json(),
        specsRes.json(),
        actsRes.json(),
        relRes.json()
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

  const urgentTasks = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const doneTasks = tasks.filter((t) => t.status === "done");
  const completionRate = Math.round((doneTasks.length / (tasks.length || 1)) * 100);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 rounded border border-[var(--color-accent)]/30">
              ENGINEERING LIFECYCLE V2.4
            </span>
            <span className="text-neutral-500 font-mono text-xs">•</span>
            <span className="text-xs font-mono text-neutral-400">
              Sprint 48 Active Cycle
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mt-1.5">
            {project?.name || "Platform Core 2.0"}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            {project?.description || "High-performance distributed telemetry, state sync, and real-time computation engine."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/app/ai"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-[var(--color-accent)]/15 hover:bg-[var(--color-accent)]/25 border border-[var(--color-accent)]/40 text-xs text-white transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />
            <span>Ask AI Copilot</span>
          </Link>
          <Link
            href="/app/tasks"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/10 text-xs text-white transition-colors"
          >
            <span>Open Kanban</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Cycle Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {project?.cycleTime || "1.4d"}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            -42% reduction vs last month
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Delivery Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {project?.velocity || "+24% vs avg"}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            Tracking ahead of baseline
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Sprint Progress</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {completionRate}%
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[var(--color-accent)] h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Blockers</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight font-mono">
            {urgentTasks.length} Detected
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            {urgentTasks.length > 0 ? "Requires review intervention" : "0 pipeline bottlenecks"}
          </div>
        </div>
      </div>

      {/* Critical Blocker Alert Callout */}
      {urgentTasks.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-amber-200">
                P0 Urgent Blockers Active ({urgentTasks.length})
              </div>
              <p className="text-xs text-amber-300/80 mt-0.5">
                {urgentTasks[0].key}: {urgentTasks[0].title} — Assigned to {urgentTasks[0].assignee.name}
              </p>
            </div>
          </div>
          <Link
            href="/app/tasks"
            className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-xs font-medium self-start sm:self-center transition-colors"
          >
            Review Issue →
          </Link>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: In-Flight Tasks & Architecture Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Work In Flight */}
          <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Active In-Flight Engineering</h3>
                <p className="text-xs text-neutral-400">Tasks currently in development and code review</p>
              </div>
              <Link
                href="/app/tasks"
                className="text-xs font-mono text-[var(--color-accent)] hover:underline flex items-center gap-1"
              >
                <span>All {tasks.length} tasks</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {tasks.slice(0, 5).map((task) => (
                <Link
                  key={task.id}
                  href="/app/tasks"
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-[#1B1E26] hover:bg-[#202430] border border-white/5 transition-all gap-2"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-[10px] font-mono text-[var(--color-accent)] font-medium shrink-0">
                      {task.key}
                    </span>
                    <span className="text-xs text-neutral-200 truncate">
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {task.branch && (
                      <span className="text-[10px] font-mono text-neutral-400 bg-black/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-sky-400" />
                        <span className="truncate max-w-[100px]">{task.branch}</span>
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded ${
                        task.status === "done"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : task.status === "in_progress"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : task.status === "review"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-white">
                      {task.assignee.initials}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Architecture Specifications */}
          <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">Architecture Specifications (Plan)</h3>
                <p className="text-xs text-neutral-400">Technical requirements and system designs</p>
              </div>
              <Link
                href="/app/specs"
                className="text-xs font-mono text-[var(--color-accent)] hover:underline flex items-center gap-1"
              >
                <span>View all specs</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {specs.map((spec) => (
                <Link
                  key={spec.id}
                  href="/app/specs"
                  className="p-3.5 rounded-lg bg-[#1B1E26] hover:bg-[#202430] border border-white/5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-sky-400">{spec.key}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                          spec.status === "approved"
                            ? "text-emerald-400 bg-emerald-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {spec.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-medium text-white line-clamp-1 mb-1">
                      {spec.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {spec.summary}
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] font-mono text-neutral-500 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span>Author: {spec.author.name.split(" ")[0]}</span>
                    <span>Spec Engine</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Canary Release State & Realtime Stream */}
        <div className="space-y-6">
          {/* Canary Deployment Widget */}
          <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Canary Release</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {release?.version || "v2.4.0"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-black/30 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Canary Traffic</span>
                <span className="font-mono text-white font-semibold">
                  {release?.canaryPercentage || 25}%
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${release?.canaryPercentage || 25}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-1">
                <span>Checks: {release?.checksPassed || 5}/{release?.totalChecks || 5} passed</span>
                <span className="text-emerald-400">Healthy</span>
              </div>
            </div>

            <Link
              href="/app/releases"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition-colors"
            >
              <span>Manage Deployment Pipeline</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Activity Feed */}
          <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Live Activity Stream</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              {activities.slice(0, 6).map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-bold text-neutral-300 shrink-0 mt-0.5">
                    {act.actor.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-300 leading-snug">
                      <span className="font-medium text-white">{act.actor.name}</span>{" "}
                      <span className="text-neutral-400">{act.action}</span>{" "}
                      <span className="font-medium text-[var(--color-accent)]">{act.target}</span>
                    </p>
                    <span className="text-[10px] font-mono text-neutral-500">{act.timestamp}</span>
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
