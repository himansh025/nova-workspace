"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  CheckSquare,
  FileCode2,
  Sparkles,
  TrendingUp,
  Rocket,
  Users,
  Settings,
  X,
  ArrowRight
} from "lucide-react";
import { Task, Spec } from "@/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Returns the appropriate status badge classes for task/spec status values */
function getStatusBadgeClass(status: string): string {
  const s = status.toLowerCase().replace(/\s/g, "_");
  if (s === "in_progress") return "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]";
  if (s === "done")        return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]";
  if (s === "review")      return "bg-[var(--nova-warning-subtle)] text-[var(--nova-warning-text)] border border-[var(--nova-warning-border)]";
  if (s === "blocked" || s === "urgent")
                           return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border border-[var(--nova-danger-border)]";
  /* todo / default */     return "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]";
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose
}) => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      fetch("/api/tasks")
        .then((res) => res.json())
        .then((data) => data.tasks && setTasks(data.tasks))
        .catch(() => {});
      fetch("/api/specs")
        .then((res) => res.json())
        .then((data) => data.specs && setSpecs(data.specs))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: "Overview Dashboard",            href: "/app",          icon: <ArrowRight className="w-3.5 h-3.5" />,  ai: false },
    { label: "Tasks & Kanban Board",           href: "/app/tasks",    icon: <CheckSquare className="w-3.5 h-3.5" />, ai: false },
    { label: "Architecture Specs (Plan)",      href: "/app/specs",    icon: <FileCode2 className="w-3.5 h-3.5" />,   ai: false },
    { label: "AI Copilot Context Engine",      href: "/app/ai",       icon: <Sparkles className="w-3.5 h-3.5" />,    ai: true  },
    { label: "Engineering Telemetry",          href: "/app/insights", icon: <TrendingUp className="w-3.5 h-3.5" />,  ai: false },
    { label: "Releases & Canary Deployments",  href: "/app/releases", icon: <Rocket className="w-3.5 h-3.5" />,      ai: false },
    { label: "Team Directory",                 href: "/app/team",     icon: <Users className="w-3.5 h-3.5" />,       ai: false },
    { label: "Workspace Settings",             href: "/app/settings", icon: <Settings className="w-3.5 h-3.5" />,    ai: false }
  ];

  const filteredNav = quickNav.filter((n) =>
    n.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTasks = tasks.filter(
    (t) =>
      t.key.toLowerCase().includes(query.toLowerCase()) ||
      t.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredSpecs = specs.filter(
    (s) =>
      s.key.toLowerCase().includes(query.toLowerCase()) ||
      s.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const hasResults =
    filteredNav.length > 0 || filteredTasks.length > 0 || filteredSpecs.length > 0;

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.4)] backdrop-blur-xs">
      {/* Dismiss on backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Centered panel */}
      <div className="relative flex justify-center pt-16 sm:pt-24 px-4">
        <div className="w-full max-w-lg sm:mx-auto flex flex-col bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.12)] overflow-hidden">

          {/* ── Search bar ── */}
          <div className="border-b border-[var(--nova-border)] px-4 py-3 bg-[var(--nova-bg)] flex items-center gap-2.5">
            <img src="/brand/logo-mark.png" alt="Nova Mark" className="w-4 h-4 object-contain shrink-0" />
            <Search className="w-[14px] h-[14px] text-[var(--nova-text-muted)] shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search issues, specs, navigation..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-placeholder)] font-sans"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] transition-colors duration-150"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <kbd className="font-mono text-[9px] bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-muted)] rounded px-1.5 py-0.5 ml-1">
              ESC
            </kbd>
          </div>

          {/* ── Results area ── */}
          <div className="max-h-[50vh] sm:max-h-80 overflow-y-auto px-2 py-2 space-y-1 nova-scroll">

            {/* Quick Navigation */}
            {filteredNav.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--nova-text-muted)] mb-0.5">
                  Navigation
                </div>
                {filteredNav.map((n) => (
                  <button
                    key={n.href}
                    onClick={() => handleSelect(n.href)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] text-left transition-colors duration-100 group"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          n.ai
                            ? "text-[var(--nova-ai)]"
                            : "text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-secondary)] transition-colors duration-100"
                        }
                      >
                        {n.icon}
                      </span>
                      <span
                        className={
                          n.ai
                            ? "text-[12px] text-[var(--nova-ai-text)]"
                            : "text-[12px] text-[var(--nova-text-secondary)] group-hover:text-[var(--nova-text-primary)] transition-colors duration-100"
                        }
                      >
                        {n.label}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--nova-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      Jump →
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Tasks & Issues */}
            {filteredTasks.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--nova-text-muted)] mb-0.5">
                  Issues ({filteredTasks.length})
                </div>
                {filteredTasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/app/tasks`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] text-left transition-colors duration-100 group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-[var(--nova-accent)] font-medium shrink-0">
                        {t.key}
                      </span>
                      <span className="text-[12px] text-[var(--nova-text-secondary)] group-hover:text-[var(--nova-text-primary)] transition-colors duration-100 truncate">
                        {t.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-2 ${getStatusBadgeClass(t.status)}`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Architecture Specs */}
            {filteredSpecs.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--nova-text-muted)] mb-0.5">
                  Specifications ({filteredSpecs.length})
                </div>
                {filteredSpecs.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(`/app/specs`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-[var(--nova-deep)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] text-left transition-colors duration-100 group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] text-[var(--nova-info-text)] font-medium shrink-0">
                        {s.key}
                      </span>
                      <span className="text-[12px] text-[var(--nova-text-secondary)] group-hover:text-[var(--nova-text-primary)] transition-colors duration-100 truncate">
                        {s.title}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-2 ${getStatusBadgeClass(s.status)}`}
                    >
                      {s.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!hasResults && (
              <div className="py-8 text-center text-[11px] text-[var(--nova-text-muted)]">
                No matching results found for &ldquo;{query}&rdquo;
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-4 py-2 bg-[var(--nova-deep)] border-t border-[var(--nova-border)] text-[var(--nova-text-muted)] flex items-center justify-between">
            <span className="text-[9px] font-mono text-[var(--nova-text-muted)]">↑↓ navigate&nbsp;&nbsp;⏎ select</span>
            <span className="text-[9px] font-mono text-[var(--nova-text-muted)]">NOVA Command</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
