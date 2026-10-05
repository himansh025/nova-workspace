"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Kanban,
  List,
  GitBranch,
  Trash2,
  Edit2,
  GripVertical,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
  Loader2,
} from "lucide-react";
import { Project, Task, TaskPriority, TaskStatus, TeamMember } from "@/types";
import TaskModal from "@/components/workspace/TaskModal";
import { apiFetchInit, getApiHeaders } from "@/lib/apiHeaders";

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const STATUS_DOT: Record<TaskStatus, string> = {
  backlog: "bg-[var(--nova-text-muted)]",
  todo: "bg-[var(--nova-accent)]",
  in_progress: "bg-[var(--nova-info)]",
  review: "bg-[var(--nova-warning)]",
  done: "bg-[var(--nova-success)]",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  backlog:
    "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]",
  todo:
    "bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] border border-[var(--nova-accent-border)]",
  in_progress:
    "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]",
  review:
    "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]",
  done:
    "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "In Review",
  done: "Done",
};

/* ─── Priority helpers ───────────────────────────────────────────────────── */
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  urgent: "text-[var(--nova-danger)]",
  high: "text-[var(--nova-warning)]",
  medium: "text-[var(--nova-accent)]",
  low: "text-[var(--nova-text-muted)]",
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function PriorityIcon({ priority }: { priority: TaskPriority }) {
  const cls = `w-3 h-3 shrink-0 ${PRIORITY_COLOR[priority]}`;
  const label = PRIORITY_LABEL[priority] || "Normal";
  let icon = <Minus className={cls} />;
  switch (priority) {
    case "urgent":
      icon = <AlertCircle className={cls} />;
      break;
    case "high":
      icon = <ArrowUp className={cls} />;
      break;
    case "medium":
      icon = <Minus className={cls} />;
      break;
    case "low":
      icon = <ArrowDown className={cls} />;
      break;
    default:
      icon = <Minus className={cls} />;
  }
  return <span title={`${label} priority`} className="flex items-center">{icon}</span>;
}

/* ─── Kanban columns config ──────────────────────────────────────────────── */
const COLUMNS: { key: TaskStatus; title: string }[] = [
  { key: "backlog", title: "Backlog" },
  { key: "todo", title: "To Do" },
  { key: "in_progress", title: "In Progress" },
  { key: "review", title: "In Review" },
  { key: "done", title: "Done" },
];

/* ════════════════════════════════════════════════════════════════════════════
   TasksPage
   ════════════════════════════════════════════════════════════════════════════ */
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);

  /* ── Data fetching ──────────────────────────────────────────────────────── */
  /* ── Data fetching ──────────────────────────────────────────────────────── */
  const fetchTasks = async (overrideProjectId?: string) => {
    try {
      let activeProjectId = overrideProjectId;
      if (activeProjectId === undefined) {
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const urlProject = urlParams.get("projectId");
          if (urlProject) {
            activeProjectId = urlProject;
            localStorage.setItem("nova_tasks_project", urlProject);
            setSelectedProject(urlProject);
          } else {
            const saved = localStorage.getItem("nova_tasks_project");
            if (saved) {
              activeProjectId = saved;
              setSelectedProject(saved);
            } else {
              activeProjectId = "all";
            }
          }
        }
      }

      let url = "/api/tasks";
      if (activeProjectId && activeProjectId !== "all") {
        url += `?projectId=${encodeURIComponent(activeProjectId)}`;
      }

      const res = await fetch(url, apiFetchInit());
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await fetch("/api/projects", apiFetchInit());
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (e) {}
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team", apiFetchInit());
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch (err) {
      console.error("Error fetching team", err);
    }
  };

  // Parallel Initial Loader: fetches tasks, team, and projects concurrently
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTasks(),
        fetchTeam(),
        fetchProjectsList(),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectFilterChange = (val: string) => {
    setSelectedProject(val);
    if (val === "all") {
      localStorage.removeItem("nova_tasks_project");
    } else {
      localStorage.setItem("nova_tasks_project", val);
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("projectId")) {
        url.searchParams.delete("projectId");
        window.history.replaceState({}, "", url.toString());
      }
    }

    fetchTasks(val);
  };

  useEffect(() => {
    loadInitialData();
    const handleRefresh = () => fetchTasks();
    window.addEventListener("task-saved", handleRefresh);
    window.addEventListener("nova:realtime_sync", handleRefresh);
    return () => {
      window.removeEventListener("task-saved", handleRefresh);
      window.removeEventListener("nova:realtime_sync", handleRefresh);
    };
  }, []);

  /* ── Status / delete handlers ───────────────────────────────────────────── */
  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      if (selectedTaskDetail?.id === taskId) {
        setSelectedTaskDetail((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
      await fetch(`/api/tasks/${taskId}`, {
        ...apiFetchInit({ "Content-Type": "application/json" }),
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  };

  const handleDropOnCard = async (
    draggedId: string,
    targetCardId: string,
    targetCol: TaskStatus
  ) => {
    if (!draggedId || draggedId === targetCardId) return;

    // Optimistic reorder: place dragged task right after target card
    setTasks((prev) => {
      const task = prev.find((t) => t.id === draggedId);
      if (!task) return prev;
      const withoutTask = prev.filter((t) => t.id !== draggedId);
      const targetIndex = withoutTask.findIndex((t) => t.id === targetCardId);
      const updatedTask = { ...task, status: targetCol };

      if (targetIndex === -1) {
        return [...withoutTask, updatedTask];
      }
      const newTasks = [...withoutTask];
      newTasks.splice(targetIndex + 1, 0, updatedTask);
      return newTasks;
    });

    if (selectedTaskDetail?.id === draggedId) {
      setSelectedTaskDetail((prev) =>
        prev ? { ...prev, status: targetCol } : null
      );
    }

    try {
      await fetch(`/api/tasks/${draggedId}`, {
        ...apiFetchInit({ "Content-Type": "application/json" }),
        method: "PATCH",
        body: JSON.stringify({ status: targetCol }),
      });
    } catch (err) {
      console.error("Failed to update status on drop", err);
      fetchTasks();
    }
  };

  const handleDropAtBottom = async (draggedId: string, targetCol: TaskStatus) => {
    if (!draggedId) return;

    // Optimistic reorder: place dragged task at the end of targetCol
    setTasks((prev) => {
      const task = prev.find((t) => t.id === draggedId);
      if (!task) return prev;
      const withoutTask = prev.filter((t) => t.id !== draggedId);

      let lastColIndex = -1;
      for (let i = withoutTask.length - 1; i >= 0; i--) {
        if (withoutTask[i].status === targetCol) {
          lastColIndex = i;
          break;
        }
      }

      const updatedTask = { ...task, status: targetCol };
      if (lastColIndex === -1) {
        return [...withoutTask, updatedTask];
      } else {
        const newTasks = [...withoutTask];
        newTasks.splice(lastColIndex + 1, 0, updatedTask);
        return newTasks;
      }
    });

    if (selectedTaskDetail?.id === draggedId) {
      setSelectedTaskDetail((prev) =>
        prev ? { ...prev, status: targetCol } : null
      );
    }

    try {
      await fetch(`/api/tasks/${draggedId}`, {
        ...apiFetchInit({ "Content-Type": "application/json" }),
        method: "PATCH",
        body: JSON.stringify({ status: targetCol }),
      });
    } catch (err) {
      console.error("Failed to update status on drop", err);
      fetchTasks();
    }
  };

  const handleUpdateAssignee = async (taskId: string, assigneeId: string) => {
    try {
      let newAssignee = { id: "unassigned", name: "Unassigned", avatar: "", initials: "--" };
      if (assigneeId !== "unassigned") {
        const member = team.find((m) => m.id === assigneeId);
        if (member) {
          newAssignee = {
            id: member.id,
            name: member.name,
            avatar: member.avatar || "",
            initials: member.initials,
          };
        }
      }

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
      );
      if (selectedTaskDetail?.id === taskId) {
        setSelectedTaskDetail((prev) =>
          prev ? { ...prev, assignee: newAssignee } : null
        );
      }
      await fetch(`/api/tasks/${taskId}`, {
        ...apiFetchInit({ "Content-Type": "application/json" }),
        method: "PATCH",
        body: JSON.stringify({ assigneeId }),
      });
    } catch (err) {
      console.error("Failed to update assignee", err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskDetail?.id === taskId) setSelectedTaskDetail(null);
      await fetch(`/api/tasks/${taskId}`, { ...apiFetchInit(), method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  };

  /* ── Filtering ──────────────────────────────────────────────────────────── */
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery === "" ||
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority =
        selectedPriority === "all" || t.priority === selectedPriority;

      const matchesAssignee =
        selectedAssignee === "all" || t.assignee.id === selectedAssignee;

      return matchesSearch && matchesPriority && matchesAssignee;
    });
  }, [tasks, searchQuery, selectedPriority, selectedAssignee]);

  /* ════════════════════════════════════════════════════════════════════════
     Render
     ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">

      {/* ── Top toolbar ───────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-center justify-between gap-3 shrink-0">
        {/* Left: title + subtitle */}
        <div className="flex flex-col">
          <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)] leading-none">
            Tasks &amp; Board
          </h1>
          <span className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
            Sprint 48 Active Cycle · Drag or update status across columns
          </span>
        </div>

        {/* Right: view toggle + new task */}
        <div className="flex items-center gap-2.5">
          {/* Kanban / List toggle */}
          <div className="bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded p-0.5 flex gap-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              title="Kanban Board"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all duration-150 ${
                viewMode === "kanban"
                  ? "bg-[var(--nova-surface)] text-[var(--nova-text-primary)] shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              <Kanban className="w-3 h-3" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all duration-150 ${
                viewMode === "list"
                  ? "bg-[var(--nova-surface)] text-[var(--nova-text-primary)] shadow-xs"
                  : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              <List className="w-3 h-3" />
              <span>List</span>
            </button>
          </div>

          {/* New Task primary button */}
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-[12px] font-medium transition-colors duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* ── Filter row ────────────────────────────────────────────────────── */}
      <div className="px-5 py-2.5 bg-[var(--nova-bg)] border-b border-[var(--nova-border-muted)] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Search (Wider) */}
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-2xl">
          <Search className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues by key, title, or branch..."
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-3 py-1.5 text-[12px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] outline-none w-full focus:border-[var(--nova-accent)] transition-colors h-8"
          />
        </div>

        {/* Purely Right: Filters */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {/* Project filter */}
          <select
            value={selectedProject}
            onChange={(e) => handleProjectFilterChange(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-2.5 py-1.5 h-8 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer focus:border-[var(--nova-border-strong)]"
          >
            <option value="all">All Engineers</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <div className="text-[10px] text-[var(--nova-text-muted)] font-mono pl-2 border-l border-[var(--nova-border)] flex items-center gap-1.5">
            {isLoading && <Loader2 className="w-3 h-3 animate-spin text-[var(--nova-accent)]" />}
            <span>{isLoading ? "Syncing..." : `${filteredTasks.length} Issues`}</span>
          </div>
        </div>
      </div>

      {/* Subtle Progress Bar */}
      {isLoading && (
        <div className="h-0.5 w-full bg-[var(--nova-accent-subtle)] overflow-hidden shrink-0">
          <div className="h-full bg-[var(--nova-accent)] animate-pulse w-full" />
        </div>
      )}

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Kanban view ───────────────────────────────────────────────── */}
        {viewMode === "kanban" && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex gap-3 h-full px-5 py-4 min-w-max items-stretch">
              {COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);
                const isColDraggedOver = dragOverCol === col.key;

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverCol !== col.key) setDragOverCol(col.key);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setDragOverCol(col.key);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragOverCol(null);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
                      if (taskId) handleDropAtBottom(taskId, col.key);
                      setDragOverCol(null);
                      setDragOverCardId(null);
                      setDraggingTaskId(null);
                    }}
                    className={`w-64 shrink-0 flex flex-col h-full bg-[var(--nova-deep)] border rounded-lg p-3 transition-all duration-200 ${
                      isColDraggedOver
                        ? "border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)]"
                        : "border-[var(--nova-border)]"
                    }`}
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between mb-3 px-0.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[col.key]}`} />
                        <span className="text-[11px] font-medium text-[var(--nova-text-secondary)]">
                          {col.title}
                        </span>
                        <span className="bg-[var(--nova-surface)] text-[var(--nova-text-muted)] border border-[var(--nova-border-muted)] font-mono text-[10px] rounded px-1.5 ml-0.5">
                          {colTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setTaskToEdit(null);
                          setIsModalOpen(true);
                        }}
                        className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-surface)] rounded transition-colors duration-150"
                        title="Add task"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Cards */}
                    <div className="flex flex-col gap-2 flex-1 overflow-y-auto nova-scroll min-h-0">
                      {colTasks.map((task) => {
                        const isDragging = draggingTaskId === task.id;
                        const isCardTargeted = dragOverCardId === task.id;
                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", task.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggingTaskId(task.id);
                            }}
                            onDragEnd={() => {
                              setDraggingTaskId(null);
                              setDragOverCol(null);
                              setDragOverCardId(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (draggingTaskId && draggingTaskId !== task.id) {
                                setDragOverCardId(task.id);
                              }
                            }}
                            onDragLeave={() => {
                              if (dragOverCardId === task.id) {
                                setDragOverCardId(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const draggedId =
                                e.dataTransfer.getData("text/plain") || draggingTaskId;
                              if (draggedId) {
                                handleDropOnCard(draggedId, task.id, col.key);
                              }
                              setDragOverCol(null);
                              setDragOverCardId(null);
                              setDraggingTaskId(null);
                            }}
                            onClick={() => {
                              if (!draggingTaskId) setSelectedTaskDetail(task);
                            }}
                            className={`group bg-[var(--nova-surface)] border rounded-md p-3 cursor-grab active:cursor-grabbing hover:border-[var(--nova-border-strong)] hover:shadow-xs transition-all duration-150 ${
                              isDragging
                                ? "opacity-40 scale-[0.97] border-dashed border-[var(--nova-accent)]"
                                : isCardTargeted
                                ? "border-[var(--nova-accent)] ring-1 ring-[var(--nova-accent)] shadow-xs"
                                : "border-[var(--nova-border)]"
                            }`}
                          >
                            {/* Top row: key + priority icon + delete button + drag grip */}
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-[10px] text-[var(--nova-accent)] font-medium">
                                {task.key}
                              </span>
                              <div className="flex items-center gap-1">
                                <PriorityIcon priority={task.priority} />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--nova-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                                  title="Delete task card"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                <GripVertical className="w-3 h-3 text-[var(--nova-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-[12px] text-[var(--nova-text-primary)] leading-snug mt-1.5 line-clamp-2">
                              {task.title}
                            </h3>

                            {/* Bottom row: branch + assignee avatar */}
                            <div className="flex items-center mt-2.5 gap-1.5">
                              {task.branch && (
                                <div className="flex items-center gap-1 bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] rounded px-1.5 py-0.5">
                                  <GitBranch className="w-2.5 h-2.5 text-[var(--nova-info)] shrink-0" />
                                  <span className="font-mono text-[10px] text-[var(--nova-text-muted)] truncate max-w-[100px]">
                                    {task.branch}
                                  </span>
                                </div>
                              )}
                              {/* Quick status mover */}
                              <select
                                value={task.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, e.target.value as TaskStatus);
                                }}
                                className="bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] text-[9px] rounded px-1 py-0.5 outline-none cursor-pointer"
                              >
                                <option value="backlog">Backlog</option>
                                <option value="todo">To Do</option>
                                <option value="in_progress">In Prog</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                              <div
                                className="w-5 h-5 rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] text-[var(--nova-accent)] text-[9px] font-bold flex items-center justify-center ml-auto shrink-0"
                                title={task.assignee.name}
                              >
                                {task.assignee.initials}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Drop target cue */}
                      {isColDraggedOver &&
                        draggingTaskId &&
                        !colTasks.some((t) => t.id === draggingTaskId) && (
                          <div className="py-4 px-3 rounded border-2 border-dashed border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] flex items-center justify-center text-[11px] font-mono animate-pulse">
                            Drop to move → {col.title}
                          </div>
                        )}

                      {/* Empty column state */}
                      {colTasks.length === 0 && !isColDraggedOver && (
                        <div className="flex-1 min-h-[140px] border border-dashed border-[var(--nova-border)] rounded-lg flex items-center justify-center text-[11px] text-[var(--nova-text-muted)] font-mono">
                          {isLoading && tasks.length === 0 ? (
                            <span className="flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin text-[var(--nova-accent)]" />
                              Syncing...
                            </span>
                          ) : (
                            "Drag issues here"
                          )}
                        </div>
                      )}

                      {/* Droppable bottom spacer to easily drop below all cards */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverCol(col.key);
                          setDragOverCardId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const draggedId =
                            e.dataTransfer.getData("text/plain") || draggingTaskId;
                          if (draggedId) {
                            handleDropAtBottom(draggedId, col.key);
                          }
                          setDragOverCol(null);
                          setDragOverCardId(null);
                          setDraggingTaskId(null);
                        }}
                        className={`flex-1 min-h-[50px] rounded-md transition-all duration-150 flex items-center justify-center ${
                          isColDraggedOver && colTasks.length > 0
                            ? "border-2 border-dashed border-[var(--nova-accent)]/50 bg-[var(--nova-accent-subtle)]/20 text-[var(--nova-accent)] text-[10px] font-mono py-2"
                            : ""
                        }`}
                      >
                        {isColDraggedOver && colTasks.length > 0 && (
                          <span>Drop here to add below</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── List view ─────────────────────────────────────────────────── */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto nova-scroll">
            {isLoading && tasks.length === 0 ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--nova-accent)]" />
                <p className="text-[12px] text-[var(--nova-text-muted)] font-mono">Loading issues...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-[var(--nova-text-muted)]" />
                <p className="text-[13px] font-medium text-[var(--nova-text-primary)]">No issues found</p>
                <p className="text-[11px] text-[var(--nova-text-muted)]">
                  Try adjusting your filters or create a new task.
                </p>
                <button
                  onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-[12px] font-medium transition-colors duration-150 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Task
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskDetail(task)}
                  className="group px-5 py-2.5 flex items-center gap-3 border-b border-[var(--nova-border-muted)] hover:bg-[var(--nova-deep)] transition-colors cursor-pointer"
                  style={{
                    borderLeft: `3px solid ${
                      task.priority === "urgent"
                        ? "var(--nova-danger)"
                        : task.priority === "high"
                        ? "var(--nova-warning)"
                        : task.priority === "medium"
                        ? "var(--nova-accent)"
                        : "var(--nova-border)"
                    }`,
                  }}
                >
                  {/* Key */}
                  <span className="font-mono text-[10px] text-[var(--nova-accent)] w-16 shrink-0">
                    {task.key}
                  </span>

                  {/* Status badge */}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium w-24 shrink-0 text-center ${STATUS_BADGE[task.status]}`}
                  >
                    {STATUS_LABEL[task.status]}
                  </span>

                  {/* Title */}
                  <span className="text-[12px] text-[var(--nova-text-primary)] flex-1 truncate">
                    {task.title}
                  </span>

                  {/* Branch */}
                  {task.branch ? (
                    <span className="font-mono text-[10px] text-[var(--nova-text-muted)] truncate max-w-32 hidden md:block">
                      {task.branch}
                    </span>
                  ) : (
                    <span className="w-32 hidden md:block" />
                  )}

                  {/* Assignee */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="w-[22px] h-[22px] rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] text-[var(--nova-accent)] text-[9px] font-bold flex items-center justify-center">
                      {task.assignee.initials}
                    </div>
                    <select
                      value={task.assignee.id}
                      onChange={(e) => handleUpdateAssignee(task.id, e.target.value)}
                      className="text-[11px] text-[var(--nova-text-secondary)] hidden lg:block bg-transparent outline-none cursor-pointer hover:bg-[var(--nova-deep)] rounded px-1 max-w-[100px] truncate appearance-none"
                    >
                      <option value="unassigned">Unassigned</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToEdit(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-surface)] rounded transition-colors duration-150"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-danger)] hover:bg-[var(--nova-danger-subtle)] rounded transition-colors duration-150"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Task detail panel ─────────────────────────────────────────── */}
        {selectedTaskDetail && (
          <div className="hidden lg:flex w-80 shrink-0 bg-[var(--nova-surface)] border-l border-[var(--nova-border)] flex-col shadow-lg">
            {/* Panel header */}
            <div className="px-4 py-3 border-b border-[var(--nova-border)] flex items-center justify-between shrink-0">
              <span className="font-mono text-[11px] text-[var(--nova-accent)] font-medium">
                {selectedTaskDetail.key}
              </span>
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded transition-colors duration-150"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Panel content */}
            <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1 nova-scroll">
              {/* Title */}
              <h2 className="text-[15px] font-medium text-[var(--nova-text-primary)] leading-snug">
                {selectedTaskDetail.title}
              </h2>

              {/* Description */}
              {selectedTaskDetail.description && (
                <p className="text-[12px] text-[var(--nova-text-secondary)] leading-relaxed">
                  {selectedTaskDetail.description}
                </p>
              )}

              {/* Metadata block */}
              <div className="bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded-lg p-3 space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--nova-text-muted)]">Status</span>
                  <select
                    value={selectedTaskDetail.status}
                    onChange={(e) =>
                      handleUpdateStatus(
                        selectedTaskDetail.id,
                        e.target.value as TaskStatus
                      )
                    }
                    className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer"
                  >
                    <option value="backlog">Backlog</option>
                                <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">In Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--nova-text-muted)]">Priority</span>
                  <div className="flex items-center gap-1.5">
                    <PriorityIcon priority={selectedTaskDetail.priority} />
                    <span className="text-[11px] text-[var(--nova-text-secondary)]">
                      {PRIORITY_LABEL[selectedTaskDetail.priority]}
                    </span>
                  </div>
                </div>

                {/* Assignee */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--nova-text-muted)]">Assignee</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] text-[var(--nova-accent)] text-[9px] font-bold flex items-center justify-center">
                      {selectedTaskDetail.assignee.initials}
                    </div>
                    <select
                      value={selectedTaskDetail.assignee.id}
                      onChange={(e) => handleUpdateAssignee(selectedTaskDetail.id, e.target.value)}
                      className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer max-w-[120px]"
                    >
                      <option value="unassigned">Unassigned</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Git branch */}
                {selectedTaskDetail.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--nova-text-muted)]">Branch</span>
                    <div className="flex items-center gap-1 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-1.5 py-0.5">
                      <GitBranch className="w-2.5 h-2.5 text-[var(--nova-info)] shrink-0" />
                      <span className="font-mono text-[10px] text-[var(--nova-text-muted)] max-w-[140px] truncate">
                        {selectedTaskDetail.branch}
                      </span>
                    </div>
                  </div>
                )}

                {/* Estimate */}
                {selectedTaskDetail.estimate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--nova-text-muted)]">Estimate</span>
                    <span className="font-mono text-[11px] text-[var(--nova-text-secondary)]">
                      {selectedTaskDetail.estimate}
                    </span>
                  </div>
                )}

                {/* Tags */}
                {selectedTaskDetail.tags.length > 0 && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] text-[var(--nova-text-muted)] shrink-0">Tags</span>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {selectedTaskDetail.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[10px] text-[var(--nova-text-secondary)] font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Panel actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setTaskToEdit(selectedTaskDetail);
                    setIsModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--nova-deep)] hover:bg-[var(--nova-elevated)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded text-[12px] transition-colors duration-150"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(selectedTaskDetail.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[var(--nova-danger)] hover:bg-[var(--nova-danger-subtle)] rounded text-[12px] transition-colors duration-150"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Mobile bottom sheet: task detail (lg and up uses the side panel above) ── */}
        {selectedTaskDetail && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[rgba(15,23,42,0.5)]"
              onClick={() => setSelectedTaskDetail(null)}
            />
            {/* Sheet */}
            <div className="relative bg-[var(--nova-surface)] border-t border-[var(--nova-border)] rounded-t-xl shadow-2xl z-10 max-h-[80vh] flex flex-col">
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-[var(--nova-border-muted)]" />
              </div>
              {/* Header */}
              <div className="px-4 py-3 border-b border-[var(--nova-border)] flex items-center justify-between shrink-0">
                <span className="font-mono text-[11px] text-[var(--nova-accent)] font-medium">
                  {selectedTaskDetail.key}
                </span>
                <button
                  onClick={() => setSelectedTaskDetail(null)}
                  className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded transition-colors duration-150"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Content */}
              <div className="px-4 py-4 space-y-4 overflow-y-auto flex-1 nova-scroll">
                <h2 className="text-[15px] font-medium text-[var(--nova-text-primary)] leading-snug">
                  {selectedTaskDetail.title}
                </h2>
                {selectedTaskDetail.description && (
                  <p className="text-[12px] text-[var(--nova-text-secondary)] leading-relaxed">
                    {selectedTaskDetail.description}
                  </p>
                )}
                <div className="bg-[var(--nova-deep)] border border-[var(--nova-border)] rounded-lg p-3 space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--nova-text-muted)]">Status</span>
                    <select
                      value={selectedTaskDetail.status}
                      onChange={(e) => handleUpdateStatus(selectedTaskDetail.id, e.target.value as TaskStatus)}
                      className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  {/* Priority */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--nova-text-muted)]">Priority</span>
                    <div className="flex items-center gap-1.5">
                      <PriorityIcon priority={selectedTaskDetail.priority} />
                      <span className="text-[11px] text-[var(--nova-text-secondary)]">
                        {PRIORITY_LABEL[selectedTaskDetail.priority]}
                      </span>
                    </div>
                  </div>
                  {/* Assignee */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--nova-text-muted)]">Assignee</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] text-[var(--nova-accent)] text-[9px] font-bold flex items-center justify-center">
                        {selectedTaskDetail.assignee.initials}
                      </div>
                      <select
                        value={selectedTaskDetail.assignee.id}
                        onChange={(e) => handleUpdateAssignee(selectedTaskDetail.id, e.target.value)}
                        className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded px-2 py-1 text-[11px] text-[var(--nova-text-secondary)] outline-none cursor-pointer max-w-[120px]"
                      >
                        <option value="unassigned">Unassigned</option>
                        {team.map((member) => (
                          <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Estimate */}
                  {selectedTaskDetail.estimate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--nova-text-muted)]">Estimate</span>
                      <span className="font-mono text-[11px] text-[var(--nova-text-secondary)]">
                        {selectedTaskDetail.estimate}
                      </span>
                    </div>
                  )}
                  {/* Tags */}
                  {selectedTaskDetail.tags.length > 0 && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] text-[var(--nova-text-muted)] shrink-0">Tags</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedTaskDetail.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[10px] text-[var(--nova-text-secondary)] font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => { setTaskToEdit(selectedTaskDetail); setIsModalOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--nova-deep)] hover:bg-[var(--nova-elevated)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded text-[12px] transition-colors duration-150"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTaskDetail.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-[var(--nova-danger)] hover:bg-[var(--nova-danger-subtle)] rounded text-[12px] transition-colors duration-150"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Creation / Edit Modal ──────────────────────────────────────────── */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={fetchTasks}
        taskToEdit={taskToEdit}
        projectId={selectedProject !== "all" ? selectedProject : undefined}
      />
    </div>
  );
}
