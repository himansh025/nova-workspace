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
import { AnalyticsData } from "@/server/types";

export default function InsightsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [metricKey, setMetricKey] = useState<"completed" | "velocity" | "throughput">("completed");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [activePoint, setActivePoint] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((resData) => {
        if (resData.analytics) setData(resData.analytics);
      })
      .catch((err) => console.error("Error loading analytics", err));
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto text-neutral-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-white">Engineering Telemetry</h1>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              P99 SIGNALS NORMAL
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Continuous cycle computation, throughput metrics, and SLA monitoring
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex bg-[#161820] border border-white/10 rounded-md p-0.5 text-xs">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1 rounded uppercase font-mono text-[11px] ${
                timeRange === r ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Cycle Time</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.cycleTimeDays || 1.4}d
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            {data?.cycleTimeDelta || "-42% reduction"}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Sprint Velocity</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.velocitySprintDelta || "+24% ahead"}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono">
            Sub-3hr SLA sustained
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Review Latency</span>
            <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.reviewLatencyHours || 2.1}h
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            Target SLA: &lt; 4.0 hours
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#14161D] border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-mono uppercase tracking-wider">Throughput</span>
            <BarChart3 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {data?.throughputPerSprint || 48}
          </div>
          <div className="text-[11px] text-neutral-400 font-mono">
            Tasks completed per sprint
          </div>
        </div>
      </div>

      {/* Main Interactive SVG Chart */}
      <div className="p-5 sm:p-6 rounded-xl bg-[#14161D] border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Velocity & Throughput Progression</h3>
            <p className="text-xs text-neutral-400">Daily closed issues and delivery velocity trend</p>
          </div>

          <div className="flex bg-[#1B1E28] border border-white/10 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setMetricKey("completed")}
              className={`px-3 py-1 rounded transition-colors ${
                metricKey === "completed" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setMetricKey("velocity")}
              className={`px-3 py-1 rounded transition-colors ${
                metricKey === "velocity" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Velocity
            </button>
            <button
              onClick={() => setMetricKey("throughput")}
              className={`px-3 py-1 rounded transition-colors ${
                metricKey === "throughput" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
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
            <line x1="0" y1="40" x2="700" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />
            <line x1="0" y1="140" x2="700" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="3,3" />

            {/* Gradient area */}
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5E43F3" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#5E43F3" stopOpacity="0.0" />
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
              stroke="#5E43F3"
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
                    fill="#5E43F3"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {isHovered && (
                    <text
                      x={x}
                      y={y - 12}
                      fill="#ffffff"
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {p[metricKey]} pts
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X Axis Labels */}
          <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-neutral-400">
            {chartPoints.map((p, i) => (
              <span key={i}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Task Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white">Issues by Lifecycle Status</h3>
          <div className="space-y-2.5">
            {data?.tasksByStatus &&
              Object.entries(data.tasksByStatus).map(([status, count]) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-neutral-300 uppercase text-[11px]">
                      {status.replace("_", " ")}
                    </span>
                    <span className="font-mono text-white font-medium">{count} tasks</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--color-accent)] h-full rounded-full"
                      style={{ width: `${(count / 10) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* By Priority */}
        <div className="p-5 rounded-xl bg-[#14161D] border border-white/10 space-y-4">
          <h3 className="text-sm font-semibold text-white">Issues by Priority SLA</h3>
          <div className="space-y-2.5">
            {data?.tasksByPriority &&
              Object.entries(data.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-neutral-300 uppercase text-[11px]">
                      {priority}
                    </span>
                    <span className="font-mono text-white font-medium">{count} tasks</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        priority === "urgent"
                          ? "bg-rose-500"
                          : priority === "high"
                          ? "bg-amber-500"
                          : "bg-blue-500"
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
