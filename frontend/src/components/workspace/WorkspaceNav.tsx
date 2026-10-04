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

interface WorkspaceNavProps {
  onOpenCommandPalette: () => void;
  onOpenNewTaskModal: () => void;
  onToggleMobileSidebar: () => void;
}

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  onOpenCommandPalette,
  onOpenNewTaskModal,
  onToggleMobileSidebar,
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
    <header className="h-12 bg-[var(--nova-surface)] border-b border-[var(--nova-border)] px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* ── Left section ── */}
      <div className="flex items-center gap-2">
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
            src="/brand/logo-mark.png"
            alt="Nova Logo Mark"
            className="w-5 h-5 object-contain"
          />
        </div>

        {/* Project switcher */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 bg-[var(--nova-bg)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded-md px-2 py-1 transition-colors duration-150"
          >
            {/* Accent status dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-accent)] shrink-0" />

            {/* Project name */}
            <span className="text-[11px] font-medium text-[var(--nova-text-primary)] truncate max-w-[140px] sm:max-w-[180px]">
              {activeProject?.name ||
                (user?.organization ? user.organization : "Workspace")}
            </span>

            {/* Sprint badge */}
            {activeProject?.sprint && (
              <span className="font-mono text-[10px] text-[var(--nova-text-muted)] bg-[var(--nova-deep)] px-1.5 rounded hidden sm:inline">
                {activeProject.sprint}
              </span>
            )}

            <ChevronDown className="w-3 h-3 text-[var(--nova-text-muted)] shrink-0" />
          </button>

          {/* Project switcher dropdown */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute left-0 top-full mt-1.5 w-72 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] py-1.5 z-50">
                {/* Dropdown header */}
                <div className="flex items-center justify-between px-3 py-1.5 mb-1 border-b border-[var(--nova-border)]">
                  <span className="text-[11px] font-medium text-[var(--nova-text-secondary)]">
                    Switch Project
                  </span>
                  <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">
                    ESC to close
                  </span>
                </div>

                {/* Project rows */}
                {projects.map((p) => {
                  const isActive = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p);
                        setIsDropdownOpen(false);
                      }}
                      className={[
                        "w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150",
                        isActive
                          ? "border-l-2 border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] pl-[10px]"
                          : "border-l-2 border-transparent hover:bg-[var(--nova-deep)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Color-coded status dot */}
                        <span
                          className={[
                            "w-1.5 h-1.5 rounded-full mt-[3px] shrink-0",
                            isActive ? "bg-[var(--nova-accent)]" : "bg-[var(--nova-text-muted)]",
                          ].join(" ")}
                        />
                        <div className="min-w-0">
                          <div className="text-[12px] font-medium text-[var(--nova-text-primary)] truncate">
                            {p.name}
                          </div>
                          <div className="font-mono text-[10px] text-[var(--nova-text-muted)] truncate">
                            {p.sprint} • {p.activeBranch}
                          </div>
                        </div>
                      </div>

                      {/* Selected check */}
                      {isActive && (
                        <Check className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Vertical separator */}
        <div className="hidden md:block w-px h-4 bg-[var(--nova-border)]" />

        {/* Branch indicator — borderless, icon + mono text */}
        <div className="hidden md:flex items-center gap-1.5 py-1">
          <GitBranch className="w-3 h-3 text-[var(--nova-info-text)] shrink-0" />
          <span className="text-[var(--nova-text-muted)] font-mono text-[10px]">
            {activeProject?.activeBranch || "main"}
          </span>
          {/* Synced status dot */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--nova-success)] ml-0.5 shrink-0"
            title="Synced"
          />
        </div>
      </div>

      {/* ── Right / Center actions ── */}
      <div className="flex items-center gap-2">
        {/* Search / Command palette trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 bg-[var(--nova-bg)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-muted)] text-[11px] rounded-md px-2.5 py-1 transition-colors duration-150"
        >
          <Search className="w-3 h-3 shrink-0" />
          <span className="hidden sm:inline">Search or jump...</span>
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
        <button
          id="new-issue-button"
          onClick={onOpenNewTaskModal}
          className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white font-medium rounded px-3 py-1.5 text-[11px] shadow-xs transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>New Issue</span>
        </button>
      </div>
    </header>
  );
};

export default WorkspaceNav;
