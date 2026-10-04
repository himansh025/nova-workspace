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
      className={`w-56 bg-[var(--nova-sidebar)] border-r border-[var(--nova-border)] flex flex-col justify-between p-3 select-none text-[var(--nova-text-primary)] text-xs font-sans shrink-0 overflow-y-auto no-scrollbar ${className}`}
    >
      {/* Workspace Switcher */}
      <div>
        <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-[var(--nova-elevated)] cursor-pointer mb-2 group transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-[var(--color-accent)] to-[#8E75FF] flex items-center justify-center text-[var(--nova-text-primary)] text-[10px] font-bold">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-[var(--nova-text-primary)] text-xs leading-none">
                Nova Core
              </span>
              <span className="text-[10px] font-mono text-[var(--nova-text-muted)] leading-none mt-1">
                main-workspace
              </span>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-primary)]" />
        </div>

        {/* Quick Search */}
        <div className="relative mb-3">
          <div className="flex items-center justify-between bg-[var(--nova-elevated)] border border-[var(--nova-border)] px-2.5 py-1.5 rounded text-[11px] text-[var(--nova-text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Search...</span>
            </div>
            <kbd className="px-1 py-0.5 text-[9px] font-mono bg-[var(--nova-surface)] text-[var(--nova-text-secondary)] rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-0.5">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
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
                    ? "bg-[var(--color-accent)]/15 text-[var(--nova-text-primary)] font-medium border border-[var(--color-accent)]/30"
                    : "hover:bg-[var(--nova-elevated)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={
                      isActive ? "text-[var(--color-accent)]" : "text-[var(--nova-text-muted)]"
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
                  <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom status & profile */}
      <div className="border-t border-[var(--nova-border)] pt-3 mt-4">
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">
            ER
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[11px] font-medium text-[var(--nova-text-primary)] truncate">
              Elena Rostova
            </span>
            <span className="text-[9px] font-mono text-[var(--nova-text-muted)] truncate">
              Lead Architect
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
