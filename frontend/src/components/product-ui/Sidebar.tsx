"use client";

import React from "react";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Users,
  Settings,
  Search,
  ChevronDown
} from "lucide-react";
import { heroMockData } from "@/data/product-demo";

interface SidebarProps {
  activeItem?: string;
  onSelectItem?: (id: string) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeItem = "tasks",
  onSelectItem,
  className = ""
}) => {
  const iconMap: Record<string, React.ReactNode> = {
    overview: <LayoutDashboard className="w-4 h-4" />,
    projects: <FolderKanban className="w-4 h-4" />,
    tasks: <CheckSquare className="w-4 h-4" />,
    ai: <Sparkles className="w-4 h-4" />,
    insights: <TrendingUp className="w-4 h-4" />,
    team: <Users className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />
  };

  return (
    <aside
      className={`w-56 bg-[#0E1014] border-r border-white/10 flex flex-col justify-between p-3 select-none text-neutral-300 text-xs font-sans shrink-0 overflow-y-auto no-scrollbar ${className}`}
    >
      {/* Workspace Switcher */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer mb-2 group transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-[var(--color-accent)] to-[#8E75FF] flex items-center justify-center text-white text-[10px] font-bold">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-white text-xs leading-none">
                Nova Core
              </span>
              <span className="text-[10px] font-mono text-neutral-500 leading-none mt-1">
                main-workspace
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
        </div>

        {/* Quick Search */}
        <div className="relative mb-3">
          <div className="flex items-center justify-between bg-white/5 border border-white/10 px-2.5 py-1.5 rounded text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
            </div>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-white/10 text-neutral-400 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Workspace
          </div>
          {heroMockData.sidebarNav.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectItem && onSelectItem(item.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors duration-150 ${
                  isActive
                    ? "bg-[var(--color-accent)]/15 text-white font-medium border border-[var(--color-accent)]/30"
                    : "hover:bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isActive ? "text-[var(--color-accent)]" : "text-neutral-500"
                    }
                  >
                    {iconMap[item.id]}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded">
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className="text-[10px] font-mono text-neutral-500">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom status & profile */}
      <div className="border-t border-white/10 pt-3 mt-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
            ER
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[11px] font-medium text-white truncate">
              Elena Rostova
            </span>
            <span className="text-[9px] font-mono text-neutral-500 truncate">
              Lead Architect
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
