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
  UserCheck,
  X,
  Trash2,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sprint, VelocityHistory, Task } from "@/types";
import { SprintSkeleton } from "@/components/workspace/Skeletons";
import { apiFetchInit, getApiHeaders } from "@/lib/apiHeaders";
import DatePicker from "@/components/ui/DatePicker";

export default function SprintsPage() {
  const { user } = useAuth();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [velocityHistory, setVelocityHistory] = useState<VelocityHistory[]>([]);
  const [avgVelocity, setAvgVelocity] = useState<number>(0);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Planning Poker State
  const [selectedTaskForPoker, setSelectedTaskForPoker] = useState<Task | null>(null);
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null);
  const [pokerSuccessMsg, setPokerSuccessMsg] = useState<string | null>(null);

  // Complete Sprint Modal State
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [rolloverTarget, setRolloverTarget] = useState<string>("");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // Create Sprint Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintGoal, setNewSprintGoal] = useState("");
  const [newSprintDurationDays, setNewSprintDurationDays] = useState(14);
  const [newSprintStartDate, setNewSprintStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newSprintEndDate, setNewSprintEndDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [startImmediately, setStartImmediately] = useState(false);
  const [isCreatingSprint, setIsCreatingSprint] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Notification / toast banner
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Hover state for SVG burndown chart
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSprintData = async () => {
    try {
      const res = await fetch("/api/sprints", apiFetchInit());
      const data = await res.json();
      if (data.success) {
        setSprints(data.sprints || []);
        setActiveSprint(data.activeSprint || null);
        setVelocityHistory(data.velocityHistory || []);
        setAvgVelocity(data.avgVelocity || 0);
        setAllTasks(data.allTasks || []);

        // Default selected sprint to active sprint, or first planned, or first available
        if (!selectedSprintId) {
          if (data.activeSprint) {
            setSelectedSprintId(data.activeSprint.id);
          } else if (data.sprints && data.sprints.length > 0) {
            const planned = data.sprints.find((s: Sprint) => s.status === "planned");
            setSelectedSprintId(planned ? planned.id : data.sprints[0].id);
          }
        }
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

  // Set default dates when duration changes
  const handleDurationChange = (days: number) => {
    setNewSprintDurationDays(days);
    const start = new Date(newSprintStartDate || Date.now());
    const end = new Date(start.getTime() + days * 86400000);
    setNewSprintEndDate(end.toISOString().split("T")[0]);
  };

  const handleStartDateChange = (dateStr: string) => {
    setNewSprintStartDate(dateStr);
    const start = new Date(dateStr);
    const end = new Date(start.getTime() + newSprintDurationDays * 86400000);
    setNewSprintEndDate(end.toISOString().split("T")[0]);
  };

  // Determine current active or selected sprint
  const currentSprint =
    sprints.find((s) => s.id === selectedSprintId) ||
    activeSprint ||
    sprints.find((s) => s.status === "planned") ||
    sprints[0] ||
    null;

  // Derive committed vs backlog tasks based on currentSprint
  const currentTaskIds = new Set(currentSprint?.taskIds || []);
  const sprintTasks = allTasks.filter((t) => currentTaskIds.has(t.id));
  const backlogTasks = allTasks.filter((t) => !currentTaskIds.has(t.id));

  // Planned sprints list
  const plannedSprints = sprints.filter((s) => s.status === "planned");

  // Create Sprint Action
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) {
      setCreateError("Please provide a sprint name.");
      return;
    }
    setCreateError(null);
    setIsCreatingSprint(true);

    try {
      const res = await fetch("/api/sprints", {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: newSprintName.trim(),
          goal: newSprintGoal.trim(),
          startDate: newSprintStartDate,
          endDate: newSprintEndDate,
          totalDays: newSprintDurationDays,
        }),
      });
      const data = await res.json();
      if (data.success && data.sprint) {
        showToast(`Sprint "${data.sprint.name}" created successfully!`);
        setIsCreateModalOpen(false);
        setNewSprintName("");
        setNewSprintGoal("");

        if (startImmediately) {
          await handleStartSprint(data.sprint.id);
        } else {
          setSelectedSprintId(data.sprint.id);
          await fetchSprintData();
        }
      } else {
        setCreateError(data.error || "Failed to create sprint.");
      }
    } catch (err: any) {
      setCreateError(err.message || "Network error while creating sprint.");
    } finally {
      setIsCreatingSprint(false);
    }
  };

  // Handle Poker Estimate
  const handleCastVote = async (points: number) => {
    if (!selectedTaskForPoker) return;
    setSelectedPoints(points);

    try {
      const res = await fetch("/api/sprints/poker", {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          taskId: selectedTaskForPoker.id,
          voter: user?.name || "Team Member",
          points,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPokerSuccessMsg(`Assigned ${points} pts to ${selectedTaskForPoker.key}`);
        setTimeout(() => setPokerSuccessMsg(null), 3000);
        showToast(`Estimated ${selectedTaskForPoker.key} as ${points} points.`);
        fetchSprintData();
      }
    } catch (err) {
      console.error("Poker vote error:", err);
      showToast("Failed to record poker vote.", "error");
    }
  };

  // Toggle Task In/Out of Sprint
  const handleToggleSprintTask = async (taskId: string, targetSprintId: string | null) => {
    const destinationSprintId = targetSprintId !== undefined ? targetSprintId : currentSprint?.id || null;
    try {
      const res = await fetch("/api/sprints/assign", {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          taskId,
          sprintId: destinationSprintId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(destinationSprintId ? "Task added to sprint." : "Task moved to backlog.");
        fetchSprintData();
      } else {
        showToast(data.error || "Failed to update sprint assignment.", "error");
      }
    } catch (err) {
      console.error("Toggle sprint task error:", err);
      showToast("Failed to update task sprint assignment.", "error");
    }
  };

  // Toggle Task Status (Done / In Progress)
  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "done" ? "in_progress" : "done";
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSprintData();
      }
    } catch (err) {
      console.error("Task status error:", err);
    }
  };

  // Handle Start Sprint
  const handleStartSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}/start`, {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Sprint successfully started and active!");
        setSelectedSprintId(sprintId);
        fetchSprintData();
      } else {
        showToast(data.error || "Failed to start sprint.", "error");
      }
    } catch (err) {
      console.error("Failed to start sprint:", err);
      showToast("Failed to start sprint.", "error");
    }
  };

  // Handle Complete Sprint
  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    setIsSubmittingComplete(true);
    try {
      const res = await fetch(`/api/sprints/${activeSprint.id}/complete`, {
        method: "POST",
        ...apiFetchInit({ "Content-Type": "application/json" }),
        body: JSON.stringify({ rolloverTargetId: rolloverTarget || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCompleteModalOpen(false);
        showToast(`Sprint cycle complete! ${data.rolledOverCount || 0} incomplete tasks rolled over.`);
        fetchSprintData();
      } else {
        showToast(data.error || "Failed to complete sprint.", "error");
      }
    } catch (err) {
      console.error("Failed to complete sprint:", err);
      showToast("Failed to complete sprint.", "error");
    } finally {
      setIsSubmittingComplete(false);
    }
  };

  // Handle Delete Sprint
  const handleDeleteSprint = async (sprintId: string, sprintName: string) => {
    if (!confirm(`Are you sure you want to delete "${sprintName}"?`)) return;
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "DELETE",
        ...apiFetchInit(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Sprint "${sprintName}" deleted.`);
        if (selectedSprintId === sprintId) {
          setSelectedSprintId(null);
        }
        fetchSprintData();
      }
    } catch (err) {
      console.error("Delete sprint error:", err);
    }
  };

  const fibonacciDeck = [1, 2, 3, 5, 8, 13, 21];

  if (loading) {
    return <SprintSkeleton />;
  }

  // ── High-Fidelity Burndown Calculations ──────────────────
  const totalDays = Math.max(1, currentSprint?.totalDays || 14);
  const totalPoints = currentSprint?.totalPoints ?? 0;
  const remainingPoints = currentSprint?.remainingPoints ?? 0;
  const completedPoints = currentSprint?.completedPoints ?? 0;
  const currentDay = Math.min(totalDays, Math.max(1, currentSprint?.currentDay || 1));

  // Build normalized burndown array with Day 0 (Kickoff baseline)
  const normalizedBurndown: {
    day: number;
    date: string;
    idealRemaining: number;
    actualRemaining: number | null;
  }[] = [];

  const rawBurndownMap = new Map((currentSprint?.burndown || []).map((b) => [b.day, b]));

  // Day 0: Kickoff baseline
  normalizedBurndown.push({
    day: 0,
    date: "Kickoff",
    idealRemaining: totalPoints,
    actualRemaining: totalPoints,
  });

  const startDateTimestamp = currentSprint?.startDate ? new Date(currentSprint.startDate).getTime() : Date.now();

  for (let day = 1; day <= totalDays; day++) {
    const dDate = new Date(startDateTimestamp + (day - 1) * 86400000);
    const dateStr = isNaN(dDate.getTime())
      ? `Day ${day}`
      : dDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const idealRemaining = Math.max(0, Math.round(totalPoints - (day / totalDays) * totalPoints));

    const existing = rawBurndownMap.get(day);
    let actualRemaining: number | null = null;

    if (day < currentDay) {
      actualRemaining = existing?.actualRemaining !== null && existing?.actualRemaining !== undefined
        ? existing.actualRemaining
        : Math.round(totalPoints - (day / currentDay) * (totalPoints - remainingPoints));
    } else if (day === currentDay) {
      actualRemaining = remainingPoints;
    } else {
      actualRemaining = null;
    }

    normalizedBurndown.push({
      day,
      date: dateStr,
      idealRemaining,
      actualRemaining,
    });
  }

  // SVG Canvas Metrics
  const svgWidth = 920;
  const svgHeight = 280;
  const paddingLeft = 52;
  const paddingRight = 36;
  const paddingTop = 26;
  const paddingBottom = 42;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxPts = Math.max(totalPoints, 10);

  const getX = (dayNum: number) => {
    return paddingLeft + (Math.max(0, Math.min(dayNum, totalDays)) / totalDays) * chartW;
  };

  const getY = (pts: number) => {
    const ratio = Math.max(0, pts) / (maxPts || 1);
    return paddingTop + (1 - ratio) * chartH;
  };

  // Ideal trajectory path
  const idealPath = `M ${getX(0)} ${getY(totalPoints)} L ${getX(totalDays)} ${getY(0)}`;

  // Actual trajectory path
  const actualDays = normalizedBurndown.filter((d) => d.actualRemaining !== null);
  const actualPath = actualDays.length > 0
    ? actualDays
        .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.day)} ${getY(d.actualRemaining!)}`)
        .join(" ")
    : "";

  const lastActual = actualDays[actualDays.length - 1];
  const actualAreaPath =
    actualDays.length > 0
      ? `${actualPath} L ${getX(lastActual.day)} ${paddingTop + chartH} L ${getX(actualDays[0].day)} ${paddingTop + chartH} Z`
      : "";

  const completedCount = sprintTasks.filter((t) => t.status === "done").length;
  const totalCount = sprintTasks.length;
  const completionPercentage = totalPoints > 0
    ? Math.round((completedPoints / totalPoints) * 100)
    : 0;

  // Real pace delta
  const todayEntry = normalizedBurndown.find((b) => b.day === currentDay);
  const paceDiff = todayEntry
    ? todayEntry.idealRemaining - (todayEntry.actualRemaining ?? remainingPoints)
    : 0;
  const isAhead = paceDiff >= 0;

  const currentHoverItem = hoveredDay !== null ? normalizedBurndown.find((b) => b.day === hoveredDay) : null;

  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent")
      return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border border-[var(--nova-danger-border)]";
    if (priority === "high")
      return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]";
    return "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--nova-bg)]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-[12px] font-medium shadow-lg ${
              toastMessage.type === "success"
                ? "bg-[var(--nova-surface)] text-[var(--nova-text-primary)] border-[var(--nova-success-border)]"
                : "bg-[var(--nova-surface)] text-[var(--nova-danger-text)] border-[var(--nova-danger-border)]"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--nova-success)]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[var(--nova-danger)]" />
            )}
            {toastMessage.text}
          </div>
        </div>
      )}

      {/* ── Sticky Page Header ──────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] text-[var(--nova-text-primary)] flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)]">
                Sprint Planning
              </h1>
              {activeSprint ? (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]">
                  Active Sprint
                </span>
              ) : (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]">
                  No Active Sprint
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              {currentSprint ? (
                <p className="text-[11px] text-[var(--nova-text-muted)]">
                  {currentSprint.name} ·{" "}
                  {currentSprint.status === "active"
                    ? `Day ${currentSprint.currentDay} of ${currentSprint.totalDays}`
                    : `Planned (${currentSprint.totalDays} days)`}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--nova-text-muted)]">
                  No sprints configured. Click "+ Create Sprint" to start planning iterations.
                </p>
              )}

              {/* Sprint Switcher Dropdown (if multiple sprints) */}
              {sprints.length > 1 && (
                <div className="relative inline-block ml-1">
                  <select
                    value={currentSprint?.id || ""}
                    onChange={(e) => setSelectedSprintId(e.target.value)}
                    aria-label="Select sprint"
                    className="text-[11px] bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded px-2 py-0.5 cursor-pointer outline-none hover:border-[var(--nova-accent-border)]"
                  >
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Create Sprint Button */}
          <button
            onClick={() => {
              setNewSprintName(`Sprint ${(sprints.length || 0) + 1}`);
              setNewSprintGoal("");
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-[var(--nova-deep)] hover:bg-[var(--nova-elevated)] border border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] text-[var(--nova-text-primary)] rounded px-3 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
            Create Sprint
          </button>

          {/* Poker Deck Button */}
          <button
            onClick={() => {
              const targetTask = backlogTasks[0] || sprintTasks[0];
              if (targetTask) setSelectedTaskForPoker(targetTask);
              else showToast("Create or add tasks to backlog first to estimate story points.", "error");
            }}
            className="flex items-center gap-1.5 bg-[var(--nova-ai-subtle)] hover:bg-[rgba(139,92,246,0.18)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-3 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Poker Deck
          </button>

          {/* Start Current Sprint (if selected sprint is planned) */}
          {currentSprint && currentSprint.status === "planned" && (
            <button
              onClick={() => handleStartSprint(currentSprint.id)}
              className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              Start Sprint
            </button>
          )}

          {/* Complete Sprint (only if active sprint is present) */}
          {activeSprint && (
            <button
              onClick={() => {
                const nextSprint = plannedSprints.find((s) => s.id !== activeSprint.id);
                setRolloverTarget(nextSprint ? nextSprint.id : "");
                setIsCompleteModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto nova-scroll px-5 py-4 space-y-4">

        {/* ── Workflow Guide Banner (When No Active Sprint) ────── */}
        {!activeSprint && (
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-accent-border)] rounded-lg p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--nova-accent)]" />
                  <h3 className="text-[13px] font-semibold text-[var(--nova-text-primary)]">
                    Sprint Planning Ready
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--nova-accent-text)] bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] px-1.5 py-0.2 rounded">
                    Workflow Step 3 & 4
                  </span>
                </div>
                <p className="text-[12px] text-[var(--nova-text-secondary)] mt-1">
                  1. Pick tasks from <strong>Product Backlog</strong> into <strong>Committed Scope</strong>. &nbsp;•&nbsp;
                  2. Use <strong>Planning Poker</strong> to estimate complexity. &nbsp;•&nbsp;
                  3. Click <strong>Start Sprint</strong> to kick off the iteration.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentSprint && currentSprint.status === "planned" ? (
                  <button
                    onClick={() => handleStartSprint(currentSprint.id)}
                    className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start {currentSprint.name} Now
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setNewSprintName(`Sprint ${(sprints.length || 0) + 1}`);
                      setStartImmediately(true);
                      setIsCreateModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create & Start Sprint
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── KPI Strip ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Committed */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Committed
            </div>
            <div className="text-[22px] font-semibold text-[var(--nova-text-primary)] font-mono leading-none">
              {totalPoints}
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
              {completedPoints}
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
              {remainingPoints}
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
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">
              {velocityHistory.length > 0 ? "Rolling historical avg" : "Current sprint burn"}
            </div>
          </div>

          {/* Burndown Pace */}
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-3.5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] mb-1">
              Pace Status
            </div>
            <div
              className={`text-[13px] font-semibold mt-1 flex items-center gap-1.5 ${
                currentSprint?.status === "active"
                  ? isAhead
                    ? "text-[var(--nova-success-text)]"
                    : "text-[var(--nova-warning-text)]"
                  : "text-[var(--nova-text-muted)]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  currentSprint?.status === "active"
                    ? isAhead
                      ? "bg-[var(--nova-success)] animate-pulse"
                      : "bg-[var(--nova-warning)]"
                    : "bg-[var(--nova-text-muted)]"
                }`}
              />
              {currentSprint?.status === "active"
                ? paceDiff > 0
                  ? `+${paceDiff} pts Ahead`
                  : paceDiff === 0
                  ? "On Schedule"
                  : `${Math.abs(paceDiff)} pts Behind`
                : currentSprint?.status === "planned"
                ? "Planned (Ready)"
                : "No Active Sprint"}
            </div>
            <div className="text-[11px] text-[var(--nova-text-muted)] mt-1">
              {currentSprint?.endDate ? `Target ${currentSprint.endDate}` : "Unscheduled"}
            </div>
          </div>
        </div>

        {/* ── High-Fidelity Burndown Chart ─────────────────────── */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-xl p-4 sm:p-5 relative overflow-hidden">
          {/* Chart Header Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[var(--nova-accent)]">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--nova-text-primary)]">
                    Burndown Trajectory
                  </h2>
                  <p className="text-[11px] text-[var(--nova-text-secondary)]">
                    Real point burn vs ideal target pace across {totalDays} iteration days.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics & Legend */}
            <div className="flex items-center gap-3 flex-wrap">
              {currentSprint?.status === "active" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[11px] font-mono">
                  <span className="text-[var(--nova-text-muted)]">Burn Rate:</span>
                  <span className="text-[var(--nova-text-primary)] font-semibold">
                    {(completedPoints / Math.max(1, currentDay)).toFixed(1)} pts/day
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[11px] font-mono">
                <span className="text-[var(--nova-text-muted)]">Burned:</span>
                <span className="text-[var(--nova-accent)] font-semibold">
                  {completionPercentage}%
                </span>
              </div>

              <div className="flex items-center gap-3 pl-2 border-l border-[var(--nova-border)] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-[var(--nova-border-strong)]" />
                  <span className="text-[var(--nova-text-muted)]">Ideal Pace</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-full bg-[var(--nova-accent)] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="text-[var(--nova-text-primary)] font-medium">Actual Burn</span>
                </div>
              </div>
            </div>
          </div>

          {/* SVG Canvas */}
          {totalPoints > 0 ? (
            <div className="relative w-full overflow-x-auto nova-scroll pt-1">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-64 sm:h-72 select-none">
                <defs>
                  {/* Glowing Area Fill Gradient */}
                  <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--nova-accent)" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="var(--nova-accent)" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="var(--nova-accent)" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Drop Shadow Filter for Actual Line */}
                  <filter id="actualGlow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--nova-accent)" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* Horizontal Grid Tiers */}
                {[0, Math.round(maxPts * 0.25), Math.round(maxPts * 0.5), Math.round(maxPts * 0.75), maxPts].map((pt, idx) => {
                  const y = getY(pt);
                  return (
                    <g key={`grid-${pt}-${idx}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="var(--nova-border-muted)"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={y + 3.5}
                        fill="var(--nova-text-muted)"
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {pt}p
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Day Grid Lines & Labels */}
                {normalizedBurndown.map((d) => {
                  const x = getX(d.day);
                  const isToday = d.day === currentDay && currentSprint?.status === "active";
                  const isKickoff = d.day === 0;

                  return (
                    <g key={`grid-day-${d.day}`}>
                      <line
                        x1={x}
                        y1={paddingTop}
                        x2={x}
                        y2={paddingTop + chartH}
                        stroke={isToday ? "var(--nova-accent)" : "var(--nova-border-muted)"}
                        strokeDasharray={isToday ? "2 2" : undefined}
                        strokeWidth={isToday ? "1.5" : "0.75"}
                        opacity={isToday ? 0.7 : 0.4}
                      />
                      <text
                        x={x}
                        y={paddingTop + chartH + 18}
                        fill={isToday ? "var(--nova-accent)" : "var(--nova-text-muted)"}
                        fontWeight={isToday ? "bold" : "normal"}
                        fontSize={isKickoff ? "9" : "10"}
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {isKickoff ? "Start" : `D${d.day}`}
                      </text>
                    </g>
                  );
                })}

                {/* Shaded Area Under Actual Curve */}
                {actualAreaPath && <path d={actualAreaPath} fill="url(#actualAreaGrad)" />}

                {/* Ideal Burndown Guideline */}
                <path
                  d={idealPath}
                  fill="none"
                  stroke="var(--nova-border-strong)"
                  strokeWidth="1.75"
                  strokeDasharray="6 5"
                  opacity="0.85"
                />

                {/* Actual Burndown Polyline */}
                {actualPath && (
                  <path
                    d={actualPath}
                    fill="none"
                    stroke="var(--nova-accent)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#actualGlow)"
                  />
                )}

                {/* Hover Laser Guide */}
                {hoveredDay !== null && (
                  <line
                    x1={getX(hoveredDay)}
                    y1={paddingTop}
                    x2={getX(hoveredDay)}
                    y2={paddingTop + chartH}
                    stroke="var(--nova-accent)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}

                {/* Interactive Data Nodes on All Recorded Days */}
                {actualDays.map((d) => {
                  const x = getX(d.day);
                  const y = getY(d.actualRemaining!);
                  const isHovered = hoveredDay === d.day;
                  const isToday = d.day === currentDay && currentSprint?.status === "active";

                  return (
                    <g
                      key={`node-${d.day}`}
                      onMouseEnter={() => setHoveredDay(d.day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className="cursor-pointer"
                    >
                      {/* Generous invisible hover target */}
                      <circle cx={x} cy={y} r="14" fill="transparent" />

                      {/* Today outer ping animation */}
                      {isToday && (
                        <circle
                          cx={x}
                          cy={y}
                          r="10"
                          fill="none"
                          stroke="var(--nova-accent)"
                          strokeWidth="1.5"
                          className="animate-ping opacity-60"
                        />
                      )}

                      {/* Node Circle */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6.5 : isToday ? 5.5 : 4.5}
                        fill={isHovered ? "var(--nova-accent-hover)" : "var(--nova-accent)"}
                        stroke="var(--nova-surface)"
                        strokeWidth={isHovered ? "2.5" : "2"}
                        className="transition-all duration-150"
                      />

                      {/* Node Inner Core on Today */}
                      {isToday && (
                        <circle cx={x} cy={y} r="2" fill="white" className="pointer-events-none" />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Floating Inspection HUD Tooltip */}
              {currentHoverItem && (
                <div className="absolute top-2 right-4 bg-[var(--nova-elevated)] border border-[var(--nova-border-strong)] p-3 rounded-xl shadow-xl text-[11px] font-mono pointer-events-none z-20 animate-in fade-in duration-150 min-w-44">
                  <div className="text-[var(--nova-text-primary)] font-semibold flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--nova-border-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                      {currentHoverItem.day === 0 ? "Kickoff Baseline" : `Day ${currentHoverItem.day}`}
                    </span>
                    <span className="text-[10px] text-[var(--nova-text-muted)] font-normal">
                      {currentHoverItem.date}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--nova-text-secondary)]">Remaining:</span>
                      <span className="text-[var(--nova-accent)] font-semibold">
                        {currentHoverItem.actualRemaining !== null ? `${currentHoverItem.actualRemaining} pts` : "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[var(--nova-text-secondary)]">Ideal Target:</span>
                      <span className="text-[var(--nova-text-muted)]">
                        {currentHoverItem.idealRemaining} pts
                      </span>
                    </div>

                    {currentHoverItem.actualRemaining !== null && (
                      <div className="flex items-center justify-between pt-1 border-t border-[var(--nova-border-muted)] text-[10px]">
                        <span className="text-[var(--nova-text-secondary)]">Burn Delta:</span>
                        <span
                          className={
                            currentHoverItem.idealRemaining - currentHoverItem.actualRemaining >= 0
                              ? "text-[var(--nova-success-text)] font-semibold"
                              : "text-[var(--nova-warning-text)] font-semibold"
                          }
                        >
                          {currentHoverItem.idealRemaining - currentHoverItem.actualRemaining >= 0
                            ? `+${currentHoverItem.idealRemaining - currentHoverItem.actualRemaining} pts Ahead`
                            : `${Math.abs(currentHoverItem.idealRemaining - currentHoverItem.actualRemaining)} pts Behind`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-14 text-center text-[12px] text-[var(--nova-text-muted)] border border-dashed border-[var(--nova-border-muted)] rounded-lg">
              <p className="font-medium text-[var(--nova-text-primary)]">No story points committed to this sprint yet</p>
              <p className="mt-1 text-[11px] text-[var(--nova-text-secondary)]">
                Add estimated tasks from the Product Backlog below to generate the burndown curve.
              </p>
            </div>
          )}

          {/* Chart Footer Meta Bar */}
          <div className="mt-3 pt-3 border-t border-[var(--nova-border-muted)] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] text-[var(--nova-text-secondary)]">
            <div className="flex items-center gap-3">
              <span>Start: <strong className="text-[var(--nova-text-primary)]">{currentSprint?.startDate || "Today"}</strong></span>
              <span>•</span>
              <span>Target End: <strong className="text-[var(--nova-text-primary)]">{currentSprint?.endDate || "Unscheduled"}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--nova-text-muted)] font-mono">Scope:</span>
              <strong className="text-[var(--nova-text-primary)] font-mono">{totalPoints} pts</strong>
              <span>({sprintTasks.length} tasks)</span>
            </div>
          </div>
        </div>

        {/* ── Planning Poker Deck ──────────────────────────────── */}
        {selectedTaskForPoker && (
          <div className="bg-[var(--nova-surface)] border border-[var(--nova-ai-border)] shadow-xs rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
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
                  Committed Scope {currentSprint ? `(${currentSprint.name})` : ""}
                </span>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] border border-[var(--nova-border)]">
                  {sprintTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-[var(--nova-text-muted)] font-mono">
                {completedPoints} / {totalPoints} pts done
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
                  {currentSprint
                    ? "No tasks assigned to this sprint yet. Pick items from the backlog below."
                    : "No sprint selected. Create a sprint to start committing tasks."}
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
              <span className="text-[11px] text-[var(--nova-text-muted)]">Ready for Sprint</span>
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
                        <Sparkles className="w-3.5 h-3.5" />
                        Estimate
                      </button>
                      <button
                        onClick={() => {
                          if (currentSprint) {
                            handleToggleSprintTask(task.id, currentSprint.id);
                          } else {
                            showToast("Please create a sprint first before adding tasks.", "error");
                            setIsCreateModalOpen(true);
                          }
                        }}
                        title="Add to Current Sprint"
                        className="flex items-center gap-1 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-2 py-1 text-[11px] font-medium transition-colors duration-150 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Sprint
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {backlogTasks.length === 0 && (
                <div className="py-10 text-center text-[12px] text-[var(--nova-text-muted)] border border-dashed border-[var(--nova-border-muted)] rounded-md mx-1">
                  Product backlog is empty — create tasks in the Tasks section to plan them here!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sprint Pipeline & Velocity History ──────────────── */}
        <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">
                Sprint Pipeline & Velocity
              </span>
              <p className="text-[12px] text-[var(--nova-text-secondary)] mt-0.5">
                Planned iterations ready to run, plus historical velocity completed points.
              </p>
            </div>
            <button
              onClick={() => {
                setNewSprintName(`Sprint ${(sprints.length || 0) + 1}`);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] text-[var(--nova-accent)] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Plan Next Sprint
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Planned Sprints Cards */}
            {plannedSprints.map((s) => (
              <div
                key={s.id}
                className={`bg-[var(--nova-elevated)] border rounded-md p-3 space-y-2 transition-all ${
                  currentSprint?.id === s.id
                    ? "border-[var(--nova-accent)]"
                    : "border-[var(--nova-accent-border)] hover:border-[var(--nova-accent)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[var(--nova-accent-text)] truncate">
                    {s.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]">
                      Planned
                    </span>
                    <button
                      onClick={() => handleDeleteSprint(s.id, s.name)}
                      className="text-[var(--nova-text-muted)] hover:text-[var(--nova-danger-text)] p-0.5 cursor-pointer"
                      title="Delete Sprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--nova-text-secondary)] line-clamp-2">
                  {s.goal || "Sprint iteration backlog."} · {s.totalPoints || 0} pts scope.
                </p>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => handleStartSprint(s.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-2.5 py-1 text-[11px] font-medium transition-all duration-150 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start
                  </button>
                  <button
                    onClick={() => setSelectedSprintId(s.id)}
                    className="flex items-center justify-center bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-2 py-1 text-[11px] transition-all duration-150 cursor-pointer"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}

            {/* Velocity History Cards */}
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

            {/* If no planned or history */}
            {plannedSprints.length === 0 && velocityHistory.length === 0 && (
              <div className="col-span-full py-6 text-center text-[12px] text-[var(--nova-text-muted)] border border-dashed border-[var(--nova-border-muted)] rounded-md">
                No past or upcoming sprints. Plan a new sprint iteration above!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ── Create Sprint Modal ───────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[var(--nova-overlay)] z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[var(--nova-elevated)] border border-[var(--nova-border-strong)] rounded-xl shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--nova-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[var(--nova-accent)]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--nova-text-primary)]">
                    Create New Sprint
                  </h3>
                  <p className="text-[11px] text-[var(--nova-text-muted)]">
                    Configure iteration dates and objectives.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded bg-[var(--nova-danger-subtle)] border border-[var(--nova-danger-border)] text-[var(--nova-danger-text)] text-[11px]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSprint} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                  Sprint Name *
                </label>
                <input
                  type="text"
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="e.g. Sprint 26: Authentication & Gateway"
                  required
                  className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded px-3 py-1.5 text-[12px] text-[var(--nova-text-primary)] outline-none focus:border-[var(--nova-accent-border)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                  Sprint Goal
                </label>
                <input
                  type="text"
                  value={newSprintGoal}
                  onChange={(e) => setNewSprintGoal(e.target.value)}
                  placeholder="e.g. Deliver OAuth2 integration and rate-limiting"
                  className="w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded px-3 py-1.5 text-[12px] text-[var(--nova-text-primary)] outline-none focus:border-[var(--nova-accent-border)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                  Iteration Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 14, 21, 28].map((days) => (
                    <button
                      type="button"
                      key={days}
                      onClick={() => handleDurationChange(days)}
                      className={`py-1.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                        newSprintDurationDays === days
                          ? "bg-[var(--nova-accent)] text-white border-[var(--nova-accent-border)]"
                          : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] border-[var(--nova-border)] hover:border-[var(--nova-border-strong)]"
                      }`}
                    >
                      {days / 7} {days === 7 ? "Week" : "Weeks"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    Start Date
                  </label>
                  <DatePicker
                    value={newSprintStartDate}
                    onChange={(val) => handleStartDateChange(val)}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1">
                    End Date
                  </label>
                  <DatePicker
                    value={newSprintEndDate}
                    onChange={(val) => setNewSprintEndDate(val)}
                    minDate={newSprintStartDate}
                    align="right"
                    placeholder="Select end date"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={startImmediately}
                  onChange={(e) => setStartImmediately(e.target.checked)}
                  className="accent-[var(--nova-accent)] rounded"
                />
                <span className="text-[12px] text-[var(--nova-text-primary)]">
                  Start this sprint immediately as active
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--nova-border-muted)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-3 py-1.5 text-[12px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSprint}
                  className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isCreatingSprint ? "Creating…" : "Create Sprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    Complete {activeSprint.name}
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
                  {completedPoints}
                  <span className="text-[11px] font-sans text-[var(--nova-text-muted)] ml-1">pts</span>
                </div>
              </div>
              <div className="bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg p-3">
                <div className="text-[11px] text-[var(--nova-text-muted)] mb-0.5">Incomplete</div>
                <div className="text-[20px] font-semibold text-[var(--nova-warning)] font-mono leading-none">
                  {remainingPoints}
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
                {/* Dynamically list planned sprints */}
                {plannedSprints
                  .filter((s) => s.id !== activeSprint.id)
                  .map((ps) => (
                    <label
                      key={ps.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] cursor-pointer transition-all duration-150"
                    >
                      <input
                        type="radio"
                        name="rollover"
                        value={ps.id}
                        checked={rolloverTarget === ps.id}
                        onChange={(e) => setRolloverTarget(e.target.value)}
                        className="accent-[var(--nova-accent)]"
                      />
                      <div>
                        <div className="text-[12px] font-medium text-[var(--nova-text-primary)]">
                          {ps.name} <span className="text-[var(--nova-accent-text)] text-[11px]">(Planned Sprint)</span>
                        </div>
                        <div className="text-[11px] text-[var(--nova-text-muted)]">
                          {ps.goal || "Rollover into upcoming planned iteration"}
                        </div>
                      </div>
                    </label>
                  ))}

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
