"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  GitBranch,
  Sparkles,
  Menu,
  ChevronDown,
  Check
} from "lucide-react";
import { Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";

interface WorkspaceNavProps {
  onOpenCommandPalette: () => void;
  onOpenNewTaskModal: () => void;
  onToggleMobileSidebar: () => void;
}

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  onOpenCommandPalette,
  onOpenNewTaskModal,
  onToggleMobileSidebar
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          setProjects(data.projects);
          setActiveProject(data.projects[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header className="h-14 bg-[#0E1015] border-b border-white/10 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Mobile Toggle & Project Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-white/5 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-white/5 border border-white/5 text-xs text-white transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
              {activeProject?.name || (user?.organization ? `${user.organization}` : "Workspace")}
            </span>
            {activeProject?.sprint && (
              <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.2 rounded hidden sm:inline">
                {activeProject.sprint}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-64 bg-[#161820] border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono text-neutral-400 uppercase tracking-wider border-b border-white/5">
                  Select Project
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-white/5 text-neutral-200"
                  >
                    <div>
                      <div className="font-medium text-white">{p.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {p.sprint} • {p.activeBranch}
                      </div>
                    </div>
                    {activeProject?.id === p.id && (
                      <Check className="w-4 h-4 text-[var(--color-accent)]" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Branch indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-black/30 border border-white/5 text-[10px] font-mono text-neutral-400">
          <GitBranch className="w-3 h-3 text-sky-400" />
          <span>{activeProject?.activeBranch || "main"}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" title="Synced" />
        </div>
      </div>

      {/* Center/Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-md text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Search or jump to...</span>
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-neutral-300 rounded border border-white/10">
            ⌘K
          </kbd>
        </button>

        {/* AI Copilot Quick Link */}
        <Link
          href="/app/ai"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-xs text-white hover:bg-[var(--color-accent)]/25 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span>AI Context</span>
        </Link>

        {/* Real-Time Notification Center */}
        <NotificationCenter />

        {/* New Issue Button */}
        <button
          onClick={onOpenNewTaskModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Issue</span>
        </button>
      </div>
    </header>
  );
};

export default WorkspaceNav;
