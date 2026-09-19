"use client";

import React, { useEffect, useRef } from "react";
import { analyticsChartData } from "@/data/product-demo";
import { animateChartLine } from "@/lib/animations/chartAnimations";
import { TrendingUp, Clock, AlertOctagon, CheckCircle2 } from "lucide-react";

interface ChartProps {
  className?: string;
  isDark?: boolean;
}

export const Chart: React.FC<ChartProps> = ({ className = "", isDark = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const secondaryPathRef = useRef<SVGPathElement>(null);

  // SVG dimensions
  const width = 580;
  const height = 180;
  const padding = 20;

  // Build SVG smooth path for velocity
  const points = analyticsChartData.map((d, i) => {
    const x = padding + (i / (analyticsChartData.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.value / 80) * (height - padding * 2);
    return `${x},${y}`;
  });

  const secondaryPoints = analyticsChartData.map((d, i) => {
    const x = padding + (i / (analyticsChartData.length - 1)) * (width - padding * 2);
    const val = d.secondaryValue || 20;
    const y = height - padding - (val / 80) * (height - padding * 2);
    return `${x},${y}`;
  });

  const primaryPathData = `M ${points.join(" L ")}`;
  const secondaryPathData = `M ${secondaryPoints.join(" L ")}`;
  const areaData = `M ${points[0]} L ${points.join(" L ")} L ${
    width - padding
  },${height - padding} L ${padding},${height - padding} Z`;

  useEffect(() => {
    if (pathRef.current && containerRef.current) {
      animateChartLine(pathRef.current, containerRef.current, { duration: 1.4 });
    }
    if (secondaryPathRef.current && containerRef.current) {
      animateChartLine(secondaryPathRef.current, containerRef.current, {
        duration: 1.6,
        delay: 0.2
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl border ${
        isDark
          ? "bg-[#111216] border-white/10 text-white"
          : "bg-white border-[var(--color-border)] text-[var(--color-foreground)]"
      } p-5 ${className}`}
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
            <Clock className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <span>Cycle Time</span>
          </div>
          <div className="text-xl font-medium tracking-tight">1.4 days</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            ↓ 42% from last sprint
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Velocity</span>
          </div>
          <div className="text-xl font-medium tracking-tight">48 pts</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
            ↑ 24% throughput
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed</span>
          </div>
          <div className="text-xl font-medium tracking-tight">94.2%</div>
          <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
            Target SLA met
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono mb-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Blockers</span>
          </div>
          <div className="text-xl font-medium tracking-tight">1 item</div>
          <div className="text-[11px] font-mono text-amber-400 mt-0.5">
            Triaged by AI
          </div>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="relative w-full overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-2">
          <span>SPRINT BURNUP & THROUGHPUT TRAJECTORY</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[var(--color-accent)] inline-block" />
              <span>Actual Velocity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-neutral-600 inline-block" />
              <span>Baseline Trend</span>
            </div>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5E43F3" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5E43F3" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0, 1, 2, 3].map((g) => {
            const y = padding + (g * (height - padding * 2)) / 3;
            return (
              <line
                key={g}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area fill under curve */}
          <path d={areaData} fill="url(#chartGradient)" />

          {/* Secondary Baseline path */}
          <path
            ref={secondaryPathRef}
            d={secondaryPathData}
            fill="none"
            stroke="#525866"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Primary Velocity Line */}
          <path
            ref={pathRef}
            d={primaryPathData}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points on Line */}
          {analyticsChartData.map((d, i) => {
            const x =
              padding + (i / (analyticsChartData.length - 1)) * (width - padding * 2);
            const y = height - padding - (d.value / 80) * (height - padding * 2);
            return (
              <g key={i} className="group">
                <circle
                  cx={x}
                  cy={y}
                  r="3.5"
                  className="fill-[var(--color-accent)] stroke-[#111216] stroke-2"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-2 px-1">
          {analyticsChartData.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chart;
