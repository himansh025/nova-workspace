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
  Check,
  X,
} from "lucide-react";
import { Project } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { apiFetchInit } from "@/lib/apiHeaders";

interface WorkspaceNavProps {
  onOpenCommandPalette: () => void;
  onOpenNewTaskModal: (projectId?: string) => void;
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar?: () => void;
}

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  onOpenCommandPalette,
  onOpenNewTaskModal,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetch("/api/projects", apiFetchInit())
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
    <header className="h-12 bg-[var(--nova-surface)] border-b border-[var(--nova-border)] px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* ── Left section ── */}
      <div className="flex items-center gap-2">
        {/* Desktop sidebar toggle */}
        {onToggleDesktopSidebar && (
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-1.5 rounded text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors duration-150 mr-1"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Mobile menu toggle & logo mark (hidden on lg+) */}
        <div className="flex items-center gap-1.5 lg:hidden">
          <button
            onClick={onToggleMobileSidebar}
            className="p-1.5 rounded text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors duration-150"
            aria-label="Toggle menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <img
            src="/brand/logo-full-light.png"
            alt="Nova Workspace Logo"
            className="h-5 w-auto object-contain"
          />
        </div>
      </div>

      {/* ── Right / Center actions ── */}
      <div className="flex items-center gap-2">
        {/* Search / Command palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-48 sm:w-64 bg-[var(--nova-bg)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-muted)] text-[11px] rounded-md px-2.5 py-1 transition-colors duration-150"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Search or jump...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1 py-px font-mono text-[9px] bg-[var(--nova-deep)] text-[var(--nova-text-muted)] rounded border border-[var(--nova-border)]">
            ⌘K
          </kbd>
        </button>

        {/* AI Context button */}
        <Link
          href="/app/ai"
          className="flex items-center gap-1.5 bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] hover:opacity-90 rounded-md px-2.5 py-1 text-[11px] transition-colors duration-150"
        >
          <Sparkles className="w-3 h-3 text-[var(--nova-ai)] shrink-0" />
          <span className="hidden md:inline">AI Context</span>
          <span className="md:hidden">AI</span>
        </Link>

        {/* Real-time notification center (existing component, keep as-is) */}
        <NotificationCenter />

        {/* Demo Tour button */}
        <button
          id="demo-tour-button"
          onClick={() => window.dispatchEvent(new Event("start-demo-tour"))}
          className="flex items-center gap-1.5 bg-[var(--nova-surface)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] font-medium rounded px-3 py-1.5 text-[11px] shadow-xs transition-all duration-150"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--nova-accent)]" />
          <span>Demo View</span>
        </button>

        {/* New Issue button */}
        <div className="relative group/new-issue">
          <button
            id="new-issue-button"
            onClick={() => {
              if (projects.length <= 1) {
                onOpenNewTaskModal(projects[0]?.id);
              }
            }}
            className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white font-medium rounded px-3 py-1.5 text-[11px] shadow-xs transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>New Issue</span>
            {projects.length > 1 && (
              <ChevronDown className="w-3 h-3 opacity-70 ml-0.5" />
            )}
          </button>
          
          {/* Dropdown menu for multiple projects */}
          {projects.length > 1 && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg shadow-xl opacity-0 invisible group-hover/new-issue:opacity-100 group-hover/new-issue:visible transition-all z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--nova-border)] bg-[var(--nova-deep)]">
                <span className="text-[10px] font-mono text-[var(--nova-text-muted)] uppercase tracking-wider">Select Project</span>
              </div>
              <div className="max-h-[200px] overflow-y-auto py-1">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onOpenNewTaskModal(p.id)}
                    className="w-full text-left px-3 py-2 text-[11px] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors truncate flex items-center justify-between group/btn"
                  >
                    <span className="truncate pr-2">{p.name}</span>
                    <Plus className="w-3 h-3 text-[var(--nova-text-muted)] opacity-0 group-hover/btn:opacity-100 group-hover/btn:text-[var(--nova-accent)] transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default WorkspaceNav;
