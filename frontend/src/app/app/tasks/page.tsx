"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Kanban,
  List,
  GitBranch,
  Trash2,
  Edit2,
  GripVertical
} from "lucide-react";
import { Task, TaskPriority, TaskStatus, TeamMember } from "@/server/types";
import TaskModal from "@/components/workspace/TaskModal";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<Task | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.team) setTeam(data.team);
    } catch (err) {
      console.error("Error fetching team", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchTeam();
    window.addEventListener("task-saved", fetchTasks);
    window.addEventListener("nova:realtime_sync", fetchTasks);
    return () => {
      window.removeEventListener("task-saved", fetchTasks);
      window.removeEventListener("nova:realtime_sync", fetchTasks);
    };
  }, []);

  const handleUpdateStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      if (selectedTaskDetail?.id === taskId) {
        setSelectedTaskDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedTaskDetail?.id === taskId) setSelectedTaskDetail(null);
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  };

  const filteredTasks = tasks.filter((t) => {
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

  const columns: { key: TaskStatus; title: string; color: string }[] = [
    { key: "backlog", title: "Backlog", color: "text-neutral-400" },
    { key: "in_progress", title: "In Progress", color: "text-blue-400" },
    { key: "review", title: "In Review", color: "text-amber-400" },
    { key: "done", title: "Done", color: "text-emerald-400" }
  ];

  const priorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "urgent":
        return <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono">P0 Urgent</span>;
      case "high":
        return <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono">P1 High</span>;
      case "medium":
        return <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono">P2 Med</span>;
      default:
        return <span className="text-neutral-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono">P3 Low</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200">
      {/* Top Controls Header */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">Engineering Issues</h1>
            <span className="text-xs font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
              {filteredTasks.length} tasks
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Sprint 48 Active Cycle • Drag or update status across columns
          </p>
        </div>

        {/* Filter Bar & Views */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter issues..."
              className="pl-8 pr-3 py-1.5 rounded-md bg-[#161820] border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-[var(--color-accent)] w-36 sm:w-48"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-[#161820] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:border-[var(--color-accent)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">P0 Urgent</option>
            <option value="high">P1 High</option>
            <option value="medium">P2 Medium</option>
            <option value="low">P3 Low</option>
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-[#161820] border border-white/10 text-xs text-neutral-300 focus:outline-hidden focus:border-[var(--color-accent)]"
          >
            <option value="all">All Engineers</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#161820] border border-white/10 rounded-md p-0.5">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded ${
                viewMode === "kanban" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
              title="Kanban Board"
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded ${
                viewMode === "list" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Issue Button */}
          <button
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-hidden p-4 sm:p-6 flex">
        {viewMode === "kanban" ? (
          /* Kanban Columns Grid */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full h-full overflow-y-auto no-scrollbar">
            {columns.map((col) => {
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
                    if (taskId) {
                      handleUpdateStatus(taskId, col.key);
                    }
                    setDragOverCol(null);
                    setDraggingTaskId(null);
                  }}
                  className={`flex flex-col rounded-xl border p-3.5 h-full overflow-hidden min-w-[240px] transition-all duration-200 ${
                    isColDraggedOver
                      ? "bg-[#181B26] border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/30"
                      : "bg-[#14161D] border-white/10"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono uppercase tracking-wider font-semibold ${col.color}`}>
                        {col.title}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setTaskToEdit(null);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-neutral-500 hover:text-white rounded hover:bg-white/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Cards Container */}
                  <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-0.5">
                    {colTasks.map((task) => {
                      const isCardBeingDragged = draggingTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", task.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverCol(null);
                          }}
                          onClick={() => {
                            if (!draggingTaskId) setSelectedTaskDetail(task);
                          }}
                          className={`p-3.5 rounded-lg bg-[#1A1D26] hover:bg-[#202430] border transition-all cursor-grab active:cursor-grabbing group shadow-sm flex flex-col justify-between space-y-2.5 ${
                            isCardBeingDragged
                              ? "opacity-40 scale-[0.98] border-dashed border-[var(--color-accent)] shadow-2xl"
                              : "border-white/10 hover:border-white/25"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-colors" />
                                <span className="text-[10px] font-mono text-[var(--color-accent)] font-medium">
                                  {task.key}
                                </span>
                              </div>
                              {priorityBadge(task.priority)}
                            </div>
                            <h3 className="text-xs font-medium text-white leading-snug line-clamp-2 pl-0.5">
                              {task.title}
                            </h3>
                          </div>

                          {task.branch && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 bg-black/30 px-2 py-0.5 rounded w-fit max-w-full">
                              <GitBranch className="w-3 h-3 text-sky-400 shrink-0" />
                              <span className="truncate">{task.branch}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-neutral-400">
                            <div className="flex items-center gap-1.5">
                              <div className="w-4 h-4 rounded-full bg-neutral-700 text-white text-[8px] flex items-center justify-center font-bold">
                                {task.assignee.initials}
                              </div>
                              <span className="text-neutral-400 text-[10px] truncate max-w-[80px]">
                                {task.assignee.name.split(" ")[0]}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {task.estimate && (
                                <span className="font-mono text-neutral-500 text-[10px]">
                                  {task.estimate}
                                </span>
                              )}
                              {/* Quick column mover */}
                              <select
                                value={task.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateStatus(task.id, e.target.value as TaskStatus);
                                }}
                                className="bg-black/40 border border-white/10 text-neutral-400 text-[9px] rounded px-1 py-0.5 focus:outline-hidden"
                              >
                                <option value="backlog">Backlog</option>
                                <option value="in_progress">In Prog</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Active Drag-Over Drop Target Cue */}
                    {isColDraggedOver && draggingTaskId && !colTasks.some((t) => t.id === draggingTaskId) && (
                      <div className="py-4 px-3 rounded-lg border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center gap-1.5 text-xs font-mono animate-pulse">
                        <span>Drop here to move to {col.title}</span>
                      </div>
                    )}

                    {colTasks.length === 0 && !isColDraggedOver && (
                      <div className="h-28 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-[11px] text-neutral-600 font-mono space-y-1">
                        <span>Drag issues here</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table / List View */
          <div className="w-full bg-[#14161D] rounded-xl border border-white/10 overflow-hidden flex flex-col">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#0E1015] border-b border-white/10 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-medium">
              <div className="col-span-2">Key & Priority</div>
              <div className="col-span-5">Title & Description</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskDetail(task)}
                  className="grid grid-cols-12 px-4 py-3 text-xs items-center hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="col-span-2 flex items-center gap-2">
                    <span className="font-mono text-[var(--color-accent)] font-medium">
                      {task.key}
                    </span>
                    {priorityBadge(task.priority)}
                  </div>
                  <div className="col-span-5 truncate pr-4">
                    <span className="text-white font-medium">{task.title}</span>
                    <span className="text-neutral-500 ml-2 text-[11px] truncate">
                      {task.description}
                    </span>
                  </div>
                  <div className="col-span-2">
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
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-neutral-700 text-white text-[9px] flex items-center justify-center font-bold">
                      {task.assignee.initials}
                    </div>
                    <span className="text-neutral-300 truncate">{task.assignee.name}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskToEdit(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1 text-neutral-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-rose-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over / Detail Drawer for selected task */}
      {selectedTaskDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setSelectedTaskDetail(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-[#14161D] border-l border-white/10 h-full p-6 flex flex-col justify-between text-neutral-200 text-xs shadow-2xl overflow-y-auto no-scrollbar">
            <div className="space-y-6">
              {/* Drawer Top */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--color-accent)]">
                    {selectedTaskDetail.key}
                  </span>
                  {priorityBadge(selectedTaskDetail.priority)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTaskToEdit(selectedTaskDetail);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-white"
                    title="Edit issue"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(selectedTaskDetail.id)}
                    className="p-1.5 rounded hover:bg-white/5 text-neutral-400 hover:text-rose-400"
                    title="Delete issue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-base font-semibold text-white mb-2">
                  {selectedTaskDetail.title}
                </h2>
                <p className="text-neutral-400 leading-relaxed text-xs">
                  {selectedTaskDetail.description || "No description provided."}
                </p>
              </div>

              {/* Properties Grid */}
              <div className="bg-[#1B1E28] rounded-lg p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Status</span>
                  <select
                    value={selectedTaskDetail.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedTaskDetail.id, e.target.value as TaskStatus)
                    }
                    className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Assignee</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[9px] font-bold">
                      {selectedTaskDetail.assignee.initials}
                    </div>
                    <span className="text-white text-xs">
                      {selectedTaskDetail.assignee.name}
                    </span>
                  </div>
                </div>

                {selectedTaskDetail.branch && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-[11px]">Git Branch</span>
                    <span className="font-mono text-sky-400 text-[11px] bg-black/40 px-2 py-0.5 rounded">
                      {selectedTaskDetail.branch}
                    </span>
                  </div>
                )}

                {selectedTaskDetail.estimate && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-[11px]">Estimate</span>
                    <span className="font-mono text-neutral-300 text-xs">
                      {selectedTaskDetail.estimate}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 text-[11px]">Tags</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {selectedTaskDetail.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-neutral-300 font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Close action */}
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedTaskDetail(null)}
                className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/15 text-white font-medium"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskSaved={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
}
