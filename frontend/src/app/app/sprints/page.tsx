"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  TrendingDown,
  Target,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ChevronRight,
  Layers,
  ArrowUpRight,
  UserCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sprint, VelocityHistory } from "@/types";
import { Task } from "@/types";
import { SprintSkeleton } from "@/components/workspace/Skeletons";

export default function SprintsPage() {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [velocityHistory, setVelocityHistory] = useState<VelocityHistory[]>([]);
  const [avgVelocity, setAvgVelocity] = useState<number>(38);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [backlogTasks, setBacklogTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Planning Poker State
  const [selectedTaskForPoker, setSelectedTaskForPoker] = useState<Task | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [pokerSuccessMsg, setPokerSuccessMsg] = useState<string | null>(null);

  // Complete Sprint Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [rolloverTarget, setRolloverTarget] = useState<string>("sprint-25");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Hover state for SVG burndown chart
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const fetchSprintData = async () => {
    try {
      const res = await fetch("/api/sprints");
      const data = await res.json();
      if (data.success) {
        setSprints(data.sprints);
        setActiveSprint(data.activeSprint);
        setVelocityHistory(data.velocityHistory);
        setAvgVelocity(data.avgVelocity);
        setSprintTasks(data.sprintTasks);
        setBacklogTasks(data.backlogTasks);
      }
    } catch (err) {
      console.error("Failed to load sprints data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSprintData();
  }, []);

  // Handle Poker Estimate
  const handleCastVote = async (points: number) => {
    if (!selectedTaskForPoker) return;
    setSelectedPoints(points);

    try {
      const res = await fetch("/api/sprints/poker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTaskForPoker.id,
          voter: user?.name || "Team Member",
          points
        })
      });
      const data = await res.json();
      if (data.success) {
        setPokerSuccessMsg(`Assigned ${points} pts to ${selectedTaskForPoker.key}`);
        setTimeout(() => setPokerSuccessMsg(null), 3000);
        fetchSprintData();
      }
    } catch (err) {
      console.error("Poker vote error:", err);
    }
  };

  // Toggle Task In/Out of Sprint
  const handleToggleSprintTask = async (taskId: string, targetSprintId: string | null) => {
    if (!activeSprint) return;
    try {
      const res = await fetch(`/api/sprints/${activeSprint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          action: targetSprintId ? "assign" : "unassign"
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSprintData();
      }
    } catch (err) {
      console.error("Toggle sprint task error:", err);
    }
  };

  // Toggle Task Status (Done / In Progress)
  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "in_progress" : "done";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      fetchSprintData();
    } catch (err) {
      console.error("Task status error:", err);
    }
  };

  // Handle Complete Sprint
  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    setIsSubmittingComplete(true);
    try {
      const res = await fetch(`/api/sprints/${activeSprint.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolloverTargetId: rolloverTarget })
      });
      const data = await res.json();
      if (data.success) {
        setIsCompleteModalOpen(false);
        fetchSprintData();
      }
    } catch (err) {
      console.error("Failed to complete sprint:", err);
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Handle Start Next Sprint
  const handleStartSprint = async (sprintId: string) => {
    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", sprintId })
      });
      const data = await res.json();
      if (data.success) {
        fetchSprintData();
      }
    } catch (err) {
      console.error("Failed to start sprint:", err);
    }
  };

  const fibonacciDeck = [1, 2, 3, 5, 8, 13, 21];

  if (loading) {
    return <SprintSkeleton />;
  }

  // Burndown SVG Calculations
  const burndownData = activeSprint?.burndown || [];
  const maxPts = activeSprint?.totalPoints || 42;
  const svgWidth = 850;
  const svgHeight = 260;
  const paddingX = 45;
  const paddingY = 30;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const getX = (dayIndex: number) => {
    const totalDays = burndownData.length > 1 ? burndownData.length - 1 : 1;
    return paddingX + (dayIndex / totalDays) * chartW;
  };

  const getY = (pts: number) => {
    const ratio = Math.max(0, pts) / (maxPts || 1);
    return paddingY + (1 - ratio) * chartH;
  };

  // Build Ideal Line path
  const idealPath = burndownData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.idealRemaining)}`)
    .join(" ");

  // Build Actual Line path
  const actualDays = burndownData.filter((d) => d.actualRemaining !== null);
  const actualPath = actualDays
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.actualRemaining!)}`)
    .join(" ");

  // Area fill under actual line
  const lastActualIndex = actualDays.length - 1;
  const actualAreaPath =
    actualDays.length > 0
      ? `${actualPath} L ${getX(lastActualIndex)} ${paddingY + chartH} L ${getX(0)} ${paddingY + chartH} Z`
      : "";

  const completedCount = sprintTasks.filter((t) => t.status === "done").length;
  const totalCount = sprintTasks.length;
  const completionPercentage = activeSprint
    ? Math.round((activeSprint.completedPoints / (activeSprint.totalPoints || 1)) * 100)
    : 0;
  const isAhead =
    activeSprint && activeSprint.burndown.find((b) => b.day === activeSprint.currentDay)
      ? (activeSprint.burndown.find((b) => b.day === activeSprint.currentDay)!.idealRemaining -
          activeSprint.remainingPoints) >= 0
      : true;

  /* ─── Priority badge helper ──────────────────────────────── */
  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent")
      return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border border-[var(--nova-danger-border)]";
    if (priority === "high")
      return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]";
    return "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--nova-bg)]">
      {/* ── Sticky Page Header ──────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] text-[var(--nova-text-primary)] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Sprint Planning
            </h1>
            {activeSprint && (
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
            {activeSprint
              ? `${activeSprint.name} · Day ${activeSprint.currentDay} of ${activeSprint.totalDays}`
              : "No active sprint"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Poker Deck button — uses AI violet accent */}
          <button
            onClick={() => {
              if (backlogTasks.length > 0) setSelectedTaskForPoker(backlogTasks[0]);
            }}
            className="flex items-center gap-1.5 bg-[var(--nova-ai-subtle)] hover:bg-[rgba(139,92,246,0.18)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-3 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Poker Deck
          </button>

          {/* Complete Sprint — primary CTA */}
          <button
            onClick={() => setIsCompleteModalOpen(true)}
            className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Complete Sprint
          </button>
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto nova-scroll px-5 py-4 space-y-4">

        {/* ── KPI Strip ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Committed */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Committed
            </div>
            <div className="text-[22px] font-semibold text-[var(--nova-text-primary)] font-mono leading-none">
              {activeSprint?.totalPoints}
              <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
            </div>
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">{totalCount} scope items</div>
          </div>

          {/* Burned / Done */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Burned / Done
            </div>
            <div className="text-[22px] font-semibold text-[var(--nova-success)] font-mono leading-none">
              {activeSprint?.completedPoints}
              <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
            </div>
            <div className="text-[11px] text-[var(--nova-success-text)] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {completionPercentage}% · {completedCount} tasks
            </div>
          </div>

          {/* Remaining */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Remaining
            </div>
            <div className="text-[22px] font-semibold text-[var(--nova-accent)] font-mono leading-none">
              {activeSprint?.remainingPoints}
              <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
            </div>
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">
              {totalCount - completedCount} open issues
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Velocity
            </div>
            <div className="text-[22px] font-semibold text-[var(--nova-ai)] font-mono leading-none">
              {avgVelocity}
              <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts/sprint</span>
            </div>
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">Rolling 3-sprint avg</div>
          </div>

          {/* Burndown Pace */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Pace
            </div>
            <div
              className={`text-[13px] font-semibold mt-1 flex items-center gap-1.5 ${
                isAhead ? "text-[var(--nova-success-text)]" : "text-[var(--nova-warning-text)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAhead ? "bg-[var(--nova-success)] animate-pulse" : "bg-[var(--nova-warning)]"
                }`}
              />
              {isAhead ? "+5 pts Ahead" : "Slightly Behind"}
            </div>
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">On track for Sep 22</div>
          </div>
        </div>

        {/* ── Burndown Chart ───────────────────────────────────── */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Burndown Trajectory
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] px-2 py-0.5 rounded">
                  Daily Point Depletion
                </span>
              </div>
              <p className="text-[12px] text-[var(--nova-text-secondary)] mt-0.5">
                Target vs actual burned story points across {activeSprint?.totalDays || 14} sprint days. Hover nodes to inspect daily deltas.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-5 border-t-2 border-dashed border-[var(--nova-text-muted)]" />
                <span className="text-[11px] text-[var(--nova-text-muted)]">Ideal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-1 bg-[var(--nova-accent)] rounded-full" />
                <span className="text-[11px] text-[var(--nova-text-secondary)]">Actual</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full overflow-x-auto nova-scroll pt-1">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-52 select-none">
              <defs>
                <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--nova-accent)" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="var(--nova-accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
              {[0, 10, 20, 30, 40].map((pt) => {
                const y = getY(pt);
                return (
                  <g key={`grid-${pt}`}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={svgWidth - paddingX}
                      y2={y}
                      stroke="var(--nova-border-muted)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="var(--nova-text-muted)"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {pt}
                    </text>
                  </g>
                );
              })}

              {/* Day Labels along X */}
              {burndownData.map((d, i) => {
                const x = getX(i);
                const isCurrent = d.day === activeSprint?.currentDay;
                return (
                  <g key={`label-${d.day}`}>
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={paddingY + chartH}
                      stroke={isCurrent ? "var(--nova-accent-border)" : "var(--nova-border-muted)"}
                      strokeDasharray={isCurrent ? "2 2" : undefined}
                    />
                    <text
                      x={x}
                      y={paddingY + chartH + 16}
                      fill={isCurrent ? "var(--nova-accent-text)" : "var(--nova-text-muted)"}
                      fontWeight={isCurrent ? "bold" : "normal"}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      D{d.day}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Actual Line */}
              {actualAreaPath && <path d={actualAreaPath} fill="url(#actualAreaGrad)" />}

              {/* Ideal Burndown Line */}
              <path
                d={idealPath}
                fill="none"
                stroke="var(--nova-border-strong)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* Actual Burndown Line */}
              <path d={actualPath} fill="none" stroke="var(--nova-accent)" strokeWidth="2.5" />

              {/* Actual Data Nodes */}
              {actualDays.map((d, i) => {
                const x = getX(i);
                const y = getY(d.actualRemaining!);
                const isHovered = hoveredDay === d.day;
                const isCurrent = d.day === activeSprint?.currentDay;

                return (
                  <g
                    key={`node-${d.day}`}
                    onMouseEnter={() => setHoveredDay(d.day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : isCurrent ? 5 : 3.5}
                      fill={isCurrent ? "var(--nova-accent-text)" : "var(--nova-accent)"}
                      stroke="var(--nova-surface)"
                      strokeWidth="2"
                    />
                    {isCurrent && (
                      <circle
                        cx={x}
                        cy={y}
                        r="8"
                        fill="none"
                        stroke="var(--nova-accent-text)"
                        strokeWidth="1"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredDay && (
              <div className="absolute top-2 right-3 bg-[var(--nova-elevated)] border border-[var(--nova-border-strong)] p-2.5 rounded-lg shadow-md text-[11px] font-mono text-[var(--nova-text-secondary)] pointer-events-none z-10">
                <div className="text-[var(--nova-text-primary)] font-medium flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3 h-3 text-[var(--nova-accent)]" />
                  Day {hoveredDay} · {burndownData[hoveredDay - 1]?.date}
                </div>
                <div>
                  Actual:{" "}
                  <span className="text-[var(--nova-accent)] font-semibold">
                    {burndownData[hoveredDay - 1]?.actualRemaining ?? "N/A"} pts
                  </span>
                </div>
                <div className="text-[var(--nova-text-muted)]">
                  Ideal: {burndownData[hoveredDay - 1]?.idealRemaining} pts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Planning Poker Deck ──────────────────────────────── */}
        {selectedTaskForPoker && (
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-ai-border)] shadow-xs rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {/* AI-accent left border treatment */}
                  <span className="w-0.5 h-4 rounded-full bg-[var(--nova-ai)]" />
                  <Sparkles className="w-3.5 h-3.5 text-[var(--nova-ai)]" />
                  <span className="text-[12px] font-medium text-[var(--nova-ai-text)]">
                    Planning Poker
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-mono bg-[var(--nova-ai-subtle)] text-[var(--nova-ai-text)] border border-[var(--nova-ai-border)]">
                    {selectedTaskForPoker.key}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--nova-text-secondary)]">
                  Vote story point complexity for:{" "}
                  <strong className="text-[var(--nova-text-primary)]">{selectedTaskForPoker.title}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {pokerSuccessMsg && (
                  <span className="flex items-center gap-1.5 rounded px-2 py-1 bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)] text-[11px] font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    {pokerSuccessMsg}
                  </span>
                )}

                {fibonacciDeck.map((pts) => (
                  <button
                    key={pts}
                    onClick={() => handleCastVote(pts)}
                    className={`w-9 h-11 rounded font-mono text-[12px] font-semibold border transition-all duration-150 cursor-pointer hover:-translate-y-0.5 ${
                      selectedPoints === pts
                        ? "bg-[var(--nova-accent)] text-white border-[var(--nova-accent-border)]"
                        : "bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] hover:text-[var(--nova-text-primary)]"
                    }`}
                  >
                    {pts}
                  </button>
                ))}

                <button
                  onClick={() => setSelectedTaskForPoker(null)}
                  className="text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-2 py-1.5 text-[12px] transition-all duration-150 ml-1 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dual Columns: Sprint Scope vs Backlog ────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Column 1: Committed Scope */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border-muted)]">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Committed Scope
                </span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] border border-[var(--nova-border)]">
                  {sprintTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-[var(--nova-text-muted)] font-mono">
                {activeSprint?.completedPoints} / {activeSprint?.totalPoints} pts done
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-4 pt-3 pb-1">
              <div className="bg-[var(--nova-deep)] h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--nova-accent)] rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="px-3 pb-3 pt-2 space-y-1.5 nova-scroll max-h-96 overflow-y-auto">
              {sprintTasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={`bg-[var(--nova-elevated)] border rounded-md p-3 transition-all duration-150 ${
                      isDone
                        ? "border-[var(--nova-success-border)] opacity-70"
                        : "border-[var(--nova-border)] hover:border-[var(--nova-border-strong)] hover:bg-[var(--nova-deep)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Done toggle */}
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer ${
                            isDone
                              ? "bg-[var(--nova-success)] border-[var(--nova-success)]"
                              : "border-[var(--nova-border-strong)] hover:border-[var(--nova-accent)]"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[var(--nova-accent)] font-mono text-[10px] uppercase tracking-widest">
                              {task.key}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${getPriorityBadge(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]">
                              {task.estimate || "3 pts"}
                            </span>
                          </div>
                          <p
                            className={`text-[12px] mt-1 truncate ${
                              isDone ? "line-through text-[var(--nova-text-muted)]" : "text-[var(--nova-text-primary)]"
                            }`}
                          >
                            {task.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setSelectedTaskForPoker(task)}
                          title="Estimate with Poker Deck"
                          className="p-1 rounded text-[var(--nova-text-muted)] hover:text-[var(--nova-ai)] hover:bg-[var(--nova-ai-subtle)] transition-all duration-150 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSprintTask(task.id, null)}
                          title="Move to Backlog"
                          className="text-[11px] text-[var(--nova-text-muted)] hover:text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)] rounded px-2 py-1 transition-all duration-150 cursor-pointer"
                        >
                          Backlog
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sprintTasks.length === 0 && (
                <div className="py-10 text-center text-[12px] text-[var(--nova-text-muted)] border border-dashed border-[var(--nova-border-muted)] rounded-md mx-1">
                  No tasks assigned to this sprint. Pick items from the backlog.
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Product Backlog */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border-muted)]">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[var(--nova-ai)]" />
                <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                  Product Backlog
                </span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] border border-[var(--nova-border)]">
                  {backlogTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-[var(--nova-text-muted)]">Ready for Grooming</span>
            </div>

            <div className="px-3 py-3 space-y-1.5 nova-scroll max-h-[26rem] overflow-y-auto">
              {backlogTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[var(--nova-elevated)] border border-[var(--nova-border)] hover:border-[var(--nova-border-strong)] hover:bg-[var(--nova-deep)] rounded-md p-3 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[var(--nova-accent)] font-mono text-[10px] uppercase tracking-widest">
                          {task.key}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${getPriorityBadge(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[var(--nova-ai-subtle)] text-[var(--nova-ai-text)] border border-[var(--nova-ai-border)]">
                          {task.estimate || "Unestimated"}
                        </span>
                      </div>
                      <p className="text-[12px] text-[var(--nova-text-primary)] mt-1 truncate">{task.title}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedTaskForPoker(task)}
                        title="Estimate Story Points"
                        className="flex items-center gap-1 bg-[var(--nova-ai-subtle)] hover:bg-[rgba(139,92,246,0.18)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-2 py-1 text-[11px] transition-all duration-150 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        Estimate
                      </button>
                      <button
                        onClick={() =>
                          handleToggleSprintTask(task.id, activeSprint?.id || "sprint-24")
                        }
                        title="Add to Active Sprint"
                        className="flex items-center gap-1 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-2 py-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Sprint
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {backlogTasks.length === 0 && (
                <div className="py-10 text-center text-[12px] text-[var(--nova-text-muted)] border border-dashed border-[var(--nova-border-muted)] rounded-md mx-1">
                  Product backlog is empty — all items groomed!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Velocity History & Sprint Pipeline ───────────────── */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                Sprint Velocity History
              </span>
              <p className="text-[12px] text-[var(--nova-text-secondary)] mt-0.5">
                Committed vs completed story points across previous iterations.
              </p>
            </div>
            <span className="text-[11px] text-[var(--nova-text-muted)] font-mono">
              Target capacity:{" "}
              <span className="text-[var(--nova-text-primary)] font-medium">40 pts</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {velocityHistory.map((item) => (
              <div
                key={item.sprintId}
                className="bg-[var(--nova-elevated)] border border-[var(--nova-border)] rounded-md p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--nova-text-primary)] truncate">
                    {item.sprintName}
                  </span>
                  <span className="text-[11px] text-[var(--nova-success-text)] font-mono">
                    {item.completionRate}%
                  </span>
                </div>
                <div className="bg-[var(--nova-deep)] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--nova-success)] rounded-full"
                    style={{ width: `${Math.min(100, item.completionRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--nova-text-muted)]">
                  <span>Committed: {item.committedPoints}p</span>
                  <span className="text-[var(--nova-text-secondary)]">Done: {item.completedPoints}p</span>
                </div>
              </div>
            ))}

            {/* Upcoming Sprint Preview */}
            {sprints.find((s) => s.status === "planned") && (
              <div className="bg-[var(--nova-elevated)] border border-[var(--nova-accent-border)] rounded-md p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--nova-accent-text)]">
                    Sprint 25
                  </span>
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]">
                    Planned
                  </span>
                </div>
                <p className="text-[11px] text-[var(--nova-text-secondary)] line-clamp-2">
                  Multi-region sharding &amp; edge session stores. 34 pts scope.
                </p>
                <button
                  onClick={() => handleStartSprint("sprint-25")}
                  className="w-full flex items-center justify-center gap-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-3 py-1.5 text-[12px] transition-all duration-150 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  Start Sprint
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Complete Sprint Modal ────────────────────────────── */}
      {isCompleteModalOpen && activeSprint && (
        <div className="fixed inset-0 bg-[var(--nova-overlay)] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--nova-elevated)] border border-[var(--nova-border-strong)] rounded-xl shadow-xl p-5 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--nova-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] flex items-center justify-center">
                  <CheckCircle2 className="w-4.5 h-4.5 text-[var(--nova-success)]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--nova-text-primary)]">
                    Complete {activeSprint.name.split(":")[0]}
                  </h3>
                  <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
                    Finalize story point burn and handle incomplete scope items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded p-1.5 transition-all duration-150 text-[13px] leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg p-3">
                <div className="text-[11px] text-[var(--nova-text-muted)] mb-0.5">Completed</div>
                <div className="text-[20px] font-semibold text-[var(--nova-success)] font-mono leading-none">
                  {activeSprint.completedPoints}
                  <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
                </div>
              </div>
              <div className="bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg p-3">
                <div className="text-[11px] text-[var(--nova-text-muted)] mb-0.5">Incomplete</div>
                <div className="text-[20px] font-semibold text-[var(--nova-warning)] font-mono leading-none">
                  {activeSprint.remainingPoints}
                  <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
                </div>
              </div>
            </div>

            {/* Rollover Destination */}
            <div className="space-y-2">
              <label className="text-[12px] text-[var(--nova-text-secondary)]">
                Destination for incomplete tasks (
                {sprintTasks.filter((t) => t.status !== "done").length} items):
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] cursor-pointer transition-all duration-150">
                  <input
                    type="radio"
                    name="rollover"
                    value="sprint-25"
                    checked={rolloverTarget === "sprint-25"}
                    onChange={(e) => setRolloverTarget(e.target.value)}
                    className="accent-[var(--nova-accent)]"
                  />
                  <div>
                    <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">
                      Sprint 25 <span className="text-[var(--nova-accent-text)] text-[11px]">(Recommended)</span>
                    </div>
                    <div className="text-[11px] text-[var(--nova-text-muted)]">
                      Rollover directly into upcoming sprint iteration
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] cursor-pointer transition-all duration-150">
                  <input
                    type="radio"
                    name="rollover"
                    value=""
                    checked={rolloverTarget === ""}
                    onChange={(e) => setRolloverTarget(e.target.value)}
                    className="accent-[var(--nova-accent)]"
                  />
                  <div>
                    <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">Product Backlog</div>
                    <div className="text-[11px] text-[var(--nova-text-muted)]">
                      Move uncompleted items back to unscheduled backlog
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--nova-border-muted)]">
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-3 py-1.5 text-[12px] transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSprint}
                disabled={isSubmittingComplete}
                className="flex items-center gap-1.5 bg-[var(--nova-success)] hover:bg-[#059669] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSubmittingComplete ? "Finalizing…" : "Confirm & Archive Sprint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
