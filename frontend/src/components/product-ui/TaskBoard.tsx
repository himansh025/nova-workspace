"use client";

import React from "react";
import { GitBranch, MoreHorizontal, Plus } from "lucide-react";
import { heroMockData, TaskItem } from "@/data/product-demo";

interface TaskBoardProps {
  className?: string;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  className = ""
}) => {
  const columns: { key: TaskItem["status"]; title: string; count: number }[] = [
    { key: "backlog", title: "Backlog", count: 4 },
    { key: "in_progress", title: "In Progress", count: 2 },
    { key: "review", title: "Review", count: 3 },
    { key: "done", title: "Done", count: 8 }
  ];

  const priorityBadge = (priority: TaskItem["priority"]) => {
    switch (priority) {
      case "urgent":
        return <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded text-[9px] font-mono">P0 Urgent</span>;
      case "high":
        return <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[9px] font-mono">P1 High</span>;
      case "medium":
        return <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[9px] font-mono">P2</span>;
      default:
        return <span className="text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-mono">P3</span>;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#111216] text-neutral-200 overflow-hidden ${className}`}>
      {/* Board Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#0E1014]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-neutral-400">Board</span>
          <span className="text-neutral-600">/</span>
          <span className="text-xs font-medium text-white">Sprint 48 Active Cycle</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            84% Complete
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-600 text-[9px] flex items-center justify-center text-white border border-[#0E1014]">
              ER
            </div>
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-[9px] flex items-center justify-center text-white border border-[#0E1014]">
              MC
            </div>
            <div className="w-5 h-5 rounded-full bg-violet-600 text-[9px] flex items-center justify-center text-white border border-[#0E1014]">
              SN
            </div>
          </div>
          <button className="flex items-center gap-1 text-[11px] bg-white/5 hover:bg-white/10 text-neutral-300 px-2 py-1 rounded border border-white/10 transition-colors">
            <Plus className="w-3 h-3" />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 flex-1 overflow-y-auto no-scrollbar">
        {columns.map((col) => {
          const colTasks = heroMockData.tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col bg-[#16181E] rounded-lg border border-white/5 p-3 min-w-[200px]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    {col.title}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.2 rounded">
                    {colTasks.length}
                  </span>
                </div>
                <MoreHorizontal className="w-3.5 h-3.5 text-neutral-600 hover:text-neutral-400 cursor-pointer" />
              </div>

              {/* Task Cards */}
              <div className="space-y-2.5 flex-1">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-md bg-[#1B1E26] border border-white/10 hover:border-white/20 transition-all cursor-pointer shadow-xs group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-[var(--color-accent)] font-medium">
                        {task.key}
                      </span>
                      {priorityBadge(task.priority)}
                    </div>

                    <p className="text-xs font-normal text-neutral-200 leading-snug line-clamp-2 mb-2.5">
                      {task.title}
                    </p>

                    {task.branch && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400 mb-2 bg-black/20 px-1.5 py-0.5 rounded w-fit">
                        <GitBranch className="w-3 h-3 text-[var(--color-secondary-accent)]" />
                        <span className="truncate max-w-[140px]">{task.branch}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-neutral-400">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-neutral-700 text-white text-[8px] flex items-center justify-center font-bold">
                          {task.assignee.initials}
                        </div>
                        <span className="text-neutral-400 text-[10px]">
                          {task.assignee.name.split(" ")[0]}
                        </span>
                      </div>
                      {task.estimate && (
                        <span className="font-mono text-neutral-500">
                          {task.estimate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="h-20 border border-dashed border-white/5 rounded flex items-center justify-center text-[11px] text-neutral-600 font-mono">
                    No active items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;
