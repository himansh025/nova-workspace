"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { AnalyticsData } from "@/types";
import { InsightsSkeleton } from "@/components/workspace/Skeletons";

export default function InsightsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [metricKey, setMetricKey] = useState<"completed" | "velocity" | "throughput">("completed");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.analytics) setData(resData.analytics);
      })
      .catch((err) => console.error("Error loading analytics", err))
      .finally(() => setLoading(false));
  }, []);

  const chartPoints = data?.chartPoints || [
    { label: "Mon", completed: 24, velocity: 18, throughput: 28 },
    { label: "Tue", completed: 38, velocity: 26, throughput: 34 },
    { label: "Wed", completed: 32, velocity: 30, throughput: 40 },
    { label: "Thu", completed: 52, velocity: 34, throughput: 46 },
    { label: "Fri", completed: 68, velocity: 45, throughput: 55 },
    { label: "Sat", completed: 42, velocity: 48, throughput: 42 },
    { label: "Sun", completed: 74, velocity: 56, throughput: 60 }
  ];

  const maxVal = Math.max(...chartPoints.map((p) => p[metricKey]), 80);

  if (loading) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="min-h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)] px-4 sm:px-6 py-4 sm:py-6 lg:py-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] p-4 rounded-lg shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Engineering Telemetry
            </h1>
            <span className="text-xs font-mono text-[var(--nova-success-text)] bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] px-2 py-0.5 rounded font-medium">
              P99 SIGNALS NORMAL
            </span>
          </div>
          <p className="text-xs text-[var(--nova-text-secondary)] mt-0.5">
            Continuous cycle computation, throughput metrics, and SLA monitoring
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded-md p-0.5 text-xs">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded uppercase font-mono text-[11px] font-medium transition-colors ${
                timeRange === r
                  ? "bg-[var(--nova-accent)] text-white shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--nova-text-muted)]">
            <span className="text-xs font-mono uppercase tracking-wider font-medium">Cycle Time</span>
            <Clock className="w-4 h-4 text-[var(--nova-info)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--nova-text-primary)] font-mono">
            {data?.cycleTimeDays || 1.4}d
          </div>
          <div className="text-[11px] text-[var(--nova-success-text)] font-mono font-medium">
            {data?.cycleTimeDelta || "-42% reduction"}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--nova-text-muted)]">
            <span className="text-xs font-mono uppercase tracking-wider font-medium">Sprint Velocity</span>
            <TrendingUp className="w-4 h-4 text-[var(--nova-success)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--nova-text-primary)] font-mono">
            {data?.velocitySprintDelta || "+24% ahead"}
          </div>
          <div className="text-[11px] text-[var(--nova-success-text)] font-mono font-medium">
            Sub-3hr SLA sustained
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--nova-text-muted)]">
            <span className="text-xs font-mono uppercase tracking-wider font-medium">Review Latency</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--nova-accent)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--nova-text-primary)] font-mono">
            {data?.reviewLatencyHours || 2.1}h
          </div>
          <div className="text-[11px] text-[var(--nova-text-secondary)] font-mono">
            Target SLA: &lt; 4.0 hours
          </div>
        </div>

        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[var(--nova-text-muted)]">
            <span className="text-xs font-mono uppercase tracking-wider font-medium">Throughput</span>
            <BarChart3 className="w-4 h-4 text-[var(--nova-warning)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--nova-text-primary)] font-mono">
            {data?.throughputPerSprint || 48}
          </div>
          <div className="text-[11px] text-[var(--nova-text-secondary)] font-mono">
            Tasks completed per sprint
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div className="p-4 sm:p-6 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">
              Velocity &amp; Throughput Progression
            </h3>
            <p className="text-xs text-[var(--nova-text-secondary)]">
              Daily closed issues and delivery velocity trend
            </p>
          </div>

          <div className="flex bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded-md p-0.5 text-xs">
            <button
              onClick={() => setMetricKey("completed")}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                metricKey === "completed"
                  ? "bg-[var(--nova-accent)] text-white shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setMetricKey("velocity")}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                metricKey === "velocity"
                  ? "bg-[var(--nova-accent)] text-white shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Velocity
            </button>
            <button
              onClick={() => setMetricKey("throughput")}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                metricKey === "throughput"
                  ? "bg-[var(--nova-accent)] text-white shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              Throughput
            </button>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="h-64 w-full relative pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(0,0,0,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(0,0,0,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(0,0,0,0.06)" strokeDasharray="3,3" />

            {/* Gradient area */}
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Chart Area Fill */}
            <polygon
              fill="url(#areaGrad)"
              points={`
                0,190
                ${chartPoints
                  .map((p, i) => {
                    const x = (i / (chartPoints.length - 1)) * 700;
                    const y = 190 - (p[metricKey] / maxVal) * 160;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                700,190
              `}
            />

            {/* Chart Primary Line */}
            <polyline
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.5"
              points={chartPoints
                .map((p, i) => {
                  const x = (i / (chartPoints.length - 1)) * 700;
                  const y = 190 - (p[metricKey] / maxVal) * 160;
                  return `${x},${y}`;
                })
                .join(" ")}
            />

            {/* Interactive Points */}
            {chartPoints.map((p, i) => {
              const x = (i / (chartPoints.length - 1)) * 700;
              const y = 190 - (p[metricKey] / maxVal) * 160;
              const isHovered = activePoint === i;

              return (
                <g key={i} onMouseEnter={() => setActivePoint(i)} onMouseLeave={() => setActivePoint(null)} className="cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "6" : "4"}
                    fill="#6366F1"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {isHovered && (
                    <text
                      x={x}
                      y={y - 12}
                      fill="var(--nova-text-primary)"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {p[metricKey]} pts
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between mt-2 pt-2 border-t border-[var(--nova-border-muted)] text-[10px] font-mono text-[var(--nova-text-muted)]">
            {chartPoints.map((p, i) => (
              <span key={i}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Task Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">Issues by Lifecycle Status</h3>
          <div className="space-y-2.5">
            {data?.tasksByStatus &&
              Object.entries(data.tasksByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-[var(--nova-text-secondary)] uppercase text-[11px]">
                      {status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-[var(--nova-text-primary)] font-medium">{count} tasks</span>
                  </div>
                  <div className="w-full bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--nova-accent)] h-full rounded-full"
                      style={{ width: `${(count / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="p-4 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs space-y-4">
          <h3 className="text-sm font-semibold text-[var(--nova-text-primary)]">Issues by Priority SLA</h3>
          <div className="space-y-2.5">
            {data?.tasksByPriority &&
              Object.entries(data.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-[var(--nova-text-secondary)] uppercase text-[11px]">
                      {priority}
                    </span>
                    <span className="font-mono text-[var(--nova-text-primary)] font-medium">{count} tasks</span>
                  </div>
                  <div className="w-full bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        priority === "urgent"
                          ? "bg-[var(--nova-danger)]"
                          : priority === "high"
                          ? "bg-[var(--nova-warning)]"
                          : "bg-[var(--nova-info)]"
                      }`}
                      style={{ width: `${(count / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
