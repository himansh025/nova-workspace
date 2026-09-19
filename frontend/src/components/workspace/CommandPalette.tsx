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
    { label: "Overview Dashboard", href: "/app", icon: <ArrowRight className="w-3.5 h-3.5" /> },
    { label: "Tasks & Kanban Board", href: "/app/tasks", icon: <CheckSquare className="w-3.5 h-3.5" /> },
    { label: "Architecture Specs (Plan)", href: "/app/specs", icon: <FileCode2 className="w-3.5 h-3.5" /> },
    { label: "AI Copilot Context Engine", href: "/app/ai", icon: <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent)]" /> },
    { label: "Engineering Telemetry", href: "/app/insights", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { label: "Releases & Canary Deployments", href: "/app/releases", icon: <Rocket className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: "Team Directory", href: "/app/team", icon: <Users className="w-3.5 h-3.5" /> },
    { label: "Workspace Settings", href: "/app/settings", icon: <Settings className="w-3.5 h-3.5" /> }
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-[#12141A] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 text-neutral-200 text-xs">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#161820]">
          <Search className="w-4 h-4 text-neutral-400 shrink-0 mr-2.5" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search issues, specs, navigation..."
            className="flex-1 bg-transparent border-none outline-hidden text-sm text-white placeholder-neutral-500 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-neutral-400 rounded ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 no-scrollbar">
          {/* Quick Navigation Targets */}
          {filteredNav.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Navigation
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredNav.map((n) => (
                  <button
                    key={n.href}
                    onClick={() => handleSelect(n.href)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">{n.icon}</span>
                      <span>{n.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Jump →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks & Issues */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Issues ({filteredTasks.length})
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredTasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(`/app/tasks`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[var(--color-accent)] font-medium shrink-0">
                        {t.key}
                      </span>
                      <span className="truncate">{t.title}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded shrink-0 ml-2">
                      {t.status.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Specs */}
          {filteredSpecs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                Specifications ({filteredSpecs.length})
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredSpecs.slice(0, 4).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(`/app/specs`)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-sky-400 font-medium shrink-0">
                        {s.key}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
                      {s.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredTasks.length === 0 && filteredSpecs.length === 0 && (
            <div className="py-8 text-center text-neutral-500 text-xs">
              No matching results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-white/10 bg-[#0E1015] flex items-center justify-between text-[10px] text-neutral-500 font-mono">
          <span>Navigate with mouse or keyboard</span>
          <span>NOVA 2.0 Command System</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
