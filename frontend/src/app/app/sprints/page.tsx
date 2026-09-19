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
    return (
      <div className="flex-1 p-8 bg-[#0B0C0E] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 font-mono text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          Loading sprint workspace & burndown models...
        </div>
      </div>
    );
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
  const actualAreaPath = actualDays.length > 0
    ? `${actualPath} L ${getX(lastActualIndex)} ${paddingY + chartH} L ${getX(0)} ${paddingY + chartH} Z`
    : "";

  const completedCount = sprintTasks.filter((t) => t.status === "done").length;
  const totalCount = sprintTasks.length;
  const completionPercentage = activeSprint ? Math.round((activeSprint.completedPoints / (activeSprint.totalPoints || 1)) * 100) : 0;
  const isAhead = activeSprint && activeSprint.burndown.find((b) => b.day === activeSprint.currentDay)
    ? (activeSprint.burndown.find((b) => b.day === activeSprint.currentDay)!.idealRemaining - activeSprint.remainingPoints) >= 0
    : true;

  return (
    <div className="flex-1 bg-[#0B0C0E] text-white flex flex-col overflow-y-auto no-scrollbar">
      {/* Top Banner Header */}
      <div className="border-b border-white/10 bg-[#101216] px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400/20" />
                Active Sprint
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                {activeSprint?.startDate} — {activeSprint?.endDate}
              </span>
              <span className="text-neutral-600">•</span>
              <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Day {activeSprint?.currentDay} of {activeSprint?.totalDays} (6 days remaining)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeSprint?.name || "Sprint Studio"}
            </h1>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {activeSprint?.goal}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (backlogTasks.length > 0) setSelectedTaskForPoker(backlogTasks[0]);
              }}
              className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono font-medium text-neutral-200 border border-white/10 flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Poker Deck
            </button>
            <button
              onClick={() => setIsCompleteModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-mono font-medium text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Sprint
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-[#12141A] border border-white/5 relative overflow-hidden">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Total Committed</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">
              {activeSprint?.totalPoints} <span className="text-xs text-neutral-500 font-sans">pts</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
              <span>{totalCount} scope items</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141A] border border-white/5 relative overflow-hidden">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Burned / Done</div>
            <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {activeSprint?.completedPoints} <span className="text-xs text-neutral-500 font-sans">pts</span>
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{completionPercentage}% complete ({completedCount} tasks)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141A] border border-white/5 relative overflow-hidden">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Remaining Scope</div>
            <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">
              {activeSprint?.remainingPoints} <span className="text-xs text-neutral-500 font-sans">pts</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {totalCount - completedCount} open issues
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141A] border border-white/5 relative overflow-hidden">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Team Velocity</div>
            <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
              {avgVelocity} <span className="text-xs text-neutral-500 font-sans">pts/sprint</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Rolling 3-sprint avg
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#12141A] border border-white/5 relative overflow-hidden">
            <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Burndown Pace</div>
            <div className={`text-sm font-bold font-mono mt-2 flex items-center gap-1.5 ${isAhead ? "text-emerald-400" : "text-amber-400"}`}>
              <span className={`w-2 h-2 rounded-full ${isAhead ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              {isAhead ? "+5 pts Ahead of Pace" : "Slightly Behind"}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              On track for Sep 22 release
            </div>
          </div>
        </div>

        {/* Interactive Burndown Chart Card */}
        <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white tracking-wide">
                  Interactive Burndown Trajectory
                </h2>
                <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-2 py-0.5 rounded">
                  Daily Point Depletion
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Target vs actual burned story points across 14 sprint days. Hover over nodes to inspect daily deltas.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-neutral-500" />
                <span className="text-neutral-400">Ideal Guideline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                <span className="text-indigo-300 font-semibold">Actual Remaining</span>
              </div>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div className="relative w-full overflow-x-auto no-scrollbar pt-2">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-56 select-none"
            >
              <defs>
                <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
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
                      stroke="rgba(255,255,255,0.06)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 8}
                      y={y + 3}
                      fill="#737373"
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
                      stroke={isCurrent ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)"}
                      strokeDasharray={isCurrent ? "2 2" : undefined}
                    />
                    <text
                      x={x}
                      y={paddingY + chartH + 16}
                      fill={isCurrent ? "#818cf8" : "#737373"}
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
              {actualAreaPath && (
                <path d={actualAreaPath} fill="url(#actualAreaGrad)" />
              )}

              {/* Ideal Burndown Line */}
              <path
                d={idealPath}
                fill="none"
                stroke="#52525b"
                strokeWidth="1.8"
                strokeDasharray="6 4"
              />

              {/* Actual Burndown Line */}
              <path
                d={actualPath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="3"
                filter="url(#glow)"
              />

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
                      r={isHovered ? 7 : isCurrent ? 5 : 4}
                      fill={isCurrent ? "#a5b4fc" : "#6366f1"}
                      stroke="#0B0C0E"
                      strokeWidth="2"
                    />
                    {isCurrent && (
                      <circle
                        cx={x}
                        cy={y}
                        r="9"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        className="animate-ping"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredDay && (
              <div className="absolute top-2 right-4 bg-neutral-900 border border-white/20 p-2.5 rounded-lg shadow-2xl text-xs font-mono text-neutral-200 pointer-events-none z-10">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Day {hoveredDay} ({burndownData[hoveredDay - 1]?.date})
                </div>
                <div className="mt-1 text-neutral-300">
                  Actual Remaining:{" "}
                  <span className="text-indigo-400 font-bold">
                    {burndownData[hoveredDay - 1]?.actualRemaining ?? "N/A"} pts
                  </span>
                </div>
                <div className="text-neutral-400">
                  Ideal Remaining:{" "}
                  <span className="text-neutral-200">
                    {burndownData[hoveredDay - 1]?.idealRemaining} pts
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Poker Deck Quick Tool */}
        {selectedTaskForPoker && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-neutral-900 border border-indigo-500/30 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300">
                    Planning Poker Estimation Deck
                  </span>
                  <span className="text-xs font-mono text-white bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                    {selectedTaskForPoker.key}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1">
                  Vote story point complexity for: <strong className="text-white">{selectedTaskForPoker.title}</strong>
                </p>
              </div>

              {pokerSuccessMsg && (
                <div className="px-3 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {pokerSuccessMsg}
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                {fibonacciDeck.map((pts) => (
                  <button
                    key={pts}
                    onClick={() => handleCastVote(pts)}
                    className={`w-9 h-11 rounded-lg font-mono text-xs font-bold border transition-all transform hover:-translate-y-1 active:translate-y-0 ${
                      selectedPoints === pts
                        ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/50"
                        : "bg-neutral-800/90 text-neutral-200 border-white/10 hover:border-indigo-400 hover:bg-neutral-700"
                    }`}
                  >
                    {pts}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTaskForPoker(null)}
                  className="px-2 py-1 text-xs text-neutral-400 hover:text-white font-mono ml-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dual Columns: Sprint Scope vs Backlog Grooming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Active Sprint Committed Scope */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">
                  Committed Scope ({sprintTasks.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {activeSprint?.completedPoints} / {activeSprint?.totalPoints} pts done
              </span>
            </div>

            <div className="space-y-2">
              {sprintTasks.map((task) => {
                const isDone = task.status === "done";
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isDone
                        ? "bg-emerald-950/10 border-emerald-500/20 opacity-80"
                        : "bg-[#161820] border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleTaskStatus(task)}
                          className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-emerald-500 border-emerald-400 text-black"
                              : "border-neutral-500 hover:border-neutral-300"
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-medium text-neutral-400">
                              {task.key}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                                task.priority === "urgent"
                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                  : task.priority === "high"
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              }`}
                            >
                              {task.priority}
                            </span>
                            <span className="text-[11px] font-mono text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {task.estimate || "3 pts"}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 truncate ${isDone ? "line-through text-neutral-500" : "text-neutral-200"}`}>
                            {task.title}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedTaskForPoker(task)}
                          title="Estimate with Poker Deck"
                          className="p-1 rounded text-neutral-400 hover:text-indigo-400 hover:bg-white/5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleSprintTask(task.id, null)}
                          title="Move to Backlog"
                          className="text-[11px] font-mono text-neutral-400 hover:text-rose-400 px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
                        >
                          To Backlog
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {sprintTasks.length === 0 && (
                <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-dashed border-white/10 rounded-xl">
                  No tasks currently assigned to this sprint. Pick items from the backlog!
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Product Backlog & Grooming */}
          <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">
                  Product Backlog ({backlogTasks.length})
                </h3>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                Ready for Sprint Grooming
              </span>
            </div>

            <div className="space-y-2">
              {backlogTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl bg-[#161820] border border-white/5 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-medium text-neutral-400">
                          {task.key}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase ${
                            task.priority === "urgent"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : task.priority === "high"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-[11px] font-mono text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded">
                          {task.estimate || "Unestimated"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-200 mt-1 truncate">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setSelectedTaskForPoker(task)}
                        title="Estimate Story Points"
                        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-indigo-300 text-[11px] font-mono border border-white/10 flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3" />
                        Estimate
                      </button>
                      <button
                        onClick={() => handleToggleSprintTask(task.id, activeSprint?.id || "sprint-24")}
                        title="Add to Active Sprint"
                        className="px-2 py-1 rounded bg-indigo-600/80 hover:bg-indigo-600 text-white text-[11px] font-mono flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Sprint
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {backlogTasks.length === 0 && (
                <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-dashed border-white/10 rounded-xl">
                  Product backlog is empty! All items groomed.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Velocity History & Sprint Pipeline */}
        <div className="p-5 rounded-2xl bg-[#12141A] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Historical Sprint Velocity & Throughput
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Committed vs Completed story points across previous iterations.
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-400">
              Target Capacity: <strong className="text-white">40 pts</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {velocityHistory.map((item) => (
              <div key={item.sprintId} className="p-4 rounded-xl bg-[#161820] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-semibold">{item.sprintName}</span>
                  <span className="text-emerald-400">{item.completionRate}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(100, item.completionRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>Committed: {item.committedPoints} pts</span>
                  <span className="text-neutral-200">Done: {item.completedPoints} pts</span>
                </div>
              </div>
            ))}

            {/* Upcoming Sprint 25 Preview Card */}
            {sprints.find((s) => s.status === "planned") && (
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-indigo-300 font-semibold">Sprint 25 (Planned)</span>
                  <span className="text-neutral-400">34 pts scope</span>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2">
                  Multi-region sharding & edge session stores.
                </p>
                <button
                  onClick={() => handleStartSprint("sprint-25")}
                  className="w-full mt-1 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Kicking off next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Sprint Modal */}
      {isCompleteModalOpen && activeSprint && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#14161F] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Complete {activeSprint.name.split(":")[0]}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Finalize story point burn and handle incomplete scope items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0B0C0E] border border-white/5 text-xs font-mono">
              <div>
                <span className="text-neutral-500 block">Completed Points</span>
                <span className="text-emerald-400 text-lg font-bold">
                  {activeSprint.completedPoints} pts
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block">Incomplete Points</span>
                <span className="text-amber-400 text-lg font-bold">
                  {activeSprint.remainingPoints} pts
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-300 block">
                Destination for Incomplete Tasks ({sprintTasks.filter((t) => t.status !== "done").length} items):
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-900 border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input
                    type="radio"
                    name="rollover"
                    value="sprint-25"
                    checked={rolloverTarget === "sprint-25"}
                    onChange={(e) => setRolloverTarget(e.target.value)}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-white">Sprint 25 (Recommended)</div>
                    <div className="text-neutral-400 text-[11px]">Rollover directly into upcoming sprint iteration</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-900 border border-white/10 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <input
                    type="radio"
                    name="rollover"
                    value=""
                    checked={rolloverTarget === ""}
                    onChange={(e) => setRolloverTarget(e.target.value)}
                    className="text-indigo-600 focus:ring-0"
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-white">Product Backlog</div>
                    <div className="text-neutral-400 text-[11px]">Move uncompleted items back to unscheduled backlog</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCompleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-mono text-neutral-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSprint}
                disabled={isSubmittingComplete}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-semibold text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
              >
                {isSubmittingComplete ? "Finalizing..." : "Confirm & Archive Sprint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
