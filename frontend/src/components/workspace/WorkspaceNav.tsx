"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Sparkles,
  Menu,
  ChevronDown,
  X,
  ArrowRight,
  CheckSquare,
  FileCode2,
  TrendingUp,
  Rocket,
  Users,
  Settings,
  GitPullRequest,
  Network,
  Kanban,
} from "lucide-react";
import { Task, Spec } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { apiFetchInit } from "@/lib/apiHeaders";
import {
  getActiveOrganizationName,
  subscribeActiveOrganization,
} from "@/lib/activeOrganization";

interface WorkspaceNavProps {
  onOpenCommandPalette?: () => void;
  onOpenNewTaskModal: (projectId?: string) => void;
  onToggleMobileSidebar: () => void;
  onToggleDesktopSidebar?: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  "/app": "Overview",
  "/app/tasks": "Tasks & Board",
  "/app/sprints": "Sprint Planning",
  "/app/pull-requests": "Pull Requests",
  "/app/specs": "Architecture Specs",
  "/app/architecture": "Service Mesh",
  "/app/ai": "AI Copilot",
  "/app/insights": "Telemetry & Signals",
  "/app/releases": "Releases & Canary",
  "/app/projects": "Projects",
  "/app/team": "Team Directory",
  "/app/settings": "Settings",
};

export const WorkspaceNav: React.FC<WorkspaceNavProps> = ({
  onOpenNewTaskModal,
  onToggleMobileSidebar,
  onToggleDesktopSidebar,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const [activeOrgName, setActiveOrgName] = useState("");

  // Search dropdown states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const cached = getActiveOrganizationName();
    if (cached) setActiveOrgName(cached);
    return subscribeActiveOrganization((org) => setActiveOrgName(org.name));
  }, []);

  // Fetch tasks and specs when search is opened for the first time
  useEffect(() => {
    if (isSearchOpen && tasks.length === 0) {
      fetch("/api/tasks", apiFetchInit())
        .then((res) => res.json())
        .then((data) => data.tasks && setTasks(data.tasks))
        .catch(() => {});
      fetch("/api/specs", apiFetchInit())
        .then((res) => res.json())
        .then((data) => data.specs && setSpecs(data.specs))
        .catch(() => {});
    }
  }, [isSearchOpen, tasks.length]);

  // Handle outside click & keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && isSearchOpen) {
        setIsSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

  // Quick navigation options
  const quickNavItems = [
    { label: "Overview Dashboard", href: "/app", icon: <ArrowRight className="w-3.5 h-3.5" />, category: "Navigation" },
    { label: "Tasks & Kanban Board", href: "/app/tasks", icon: <CheckSquare className="w-3.5 h-3.5" />, category: "Navigation" },
    { label: "Sprint Planning", href: "/app/sprints", icon: <Kanban className="w-3.5 h-3.5" />, category: "Navigation" },
    { label: "Pull Requests", href: "/app/pull-requests", icon: <GitPullRequest className="w-3.5 h-3.5" />, category: "Navigation" },
    { label: "Architecture Specs", href: "/app/specs", icon: <FileCode2 className="w-3.5 h-3.5" />, category: "Navigation" },
    // { label: "Service Mesh Architecture", href: "/app/architecture", icon: <Network className="w-3.5 h-3.5" />, category: "Navigation" },
    { label: "AI Copilot Context Engine", href: "/app/ai", icon: <Sparkles className="w-3.5 h-3.5 text-[var(--nova-ai)]" />, category: "AI & Intelligence" },
    { label: "Engineering Telemetry", href: "/app/insights", icon: <TrendingUp className="w-3.5 h-3.5" />, category: "Operations" },
    // { label: "Releases & Canary Deployments", href: "/app/releases", icon: <Rocket className="w-3.5 h-3.5" />, category: "Operations" },
    { label: "Team Directory", href: "/app/team", icon: <Users className="w-3.5 h-3.5" />, category: "Organization" },
    { label: "Workspace Settings", href: "/app/settings", icon: <Settings className="w-3.5 h-3.5" />, category: "Organization" },
  ];

  const filteredNav = quickNavItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter(
    (t) =>
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSpecs = specs.filter(
    (s) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRoute = (href: string) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    searchInputRef.current?.blur();
    router.push(href);
  };

  // Determine current breadcrumb label
  const currentSection =
    SECTION_LABELS[pathname] ||
    (pathname
      ? pathname
          .replace("/app/", "")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "Overview");

  return (
    <header className="h-12 bg-[var(--nova-surface)] border-b border-[var(--nova-border)] px-4 flex items-center justify-between shrink-0 select-none z-30 relative">
      {/* ── Left section: Sidebar toggle & Breadcrumbs ── */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Desktop sidebar toggle */}
        {onToggleDesktopSidebar && (
          <button
            onClick={onToggleDesktopSidebar}
            className="hidden lg:flex p-1.5 rounded text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors duration-150"
            aria-label="Toggle sidebar"
            title="Toggle Sidebar"
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

        {/* ── Breadcrumb Navigation (Desktop / Tablet only) ── */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium pl-1 text-[var(--nova-text-secondary)] min-w-0">
          <Link
            href="/app"
            className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] transition-colors truncate max-w-[130px] hidden sm:inline min-w-[4ch]"
            suppressHydrationWarning
          >
            {activeOrgName || "\u00a0"}
          </Link>
          <span className="text-[var(--nova-text-muted)] opacity-40 hidden sm:inline">
            /
          </span>
          <span className="text-[var(--nova-text-primary)] font-semibold tracking-tight truncate">
            {currentSection}
          </span>
        </div>
      </div>

      {/* ── Right / Center actions ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* ── Wide Search Bar with Dropdown (Desktop/Tablet only; on mobile it is in the sidebar menu) ── */}
       
        {/* <div
          ref={searchContainerRef}
          className="relative hidden md:block md:w-72 lg:w-[420px]"
        >
          <div
            className={`flex items-center gap-2 bg-[var(--nova-bg)] border ${
              isSearchOpen
                ? "border-[var(--nova-accent)] ring-2 ring-[var(--nova-accent)]/15 shadow-sm"
                : "border-[var(--nova-border)] hover:border-[var(--nova-border-strong)]"
            } rounded-md px-2.5 py-1.5 transition-all duration-150`}
          >
            <Search className="w-3.5 h-3.5 text-[var(--nova-text-muted)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchOpen) setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search or jump to page, task, spec..."
              className="bg-transparent border-none text-[11px] text-[var(--nova-text-primary)] placeholder-[var(--nova-text-muted)] w-full outline-none focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 font-mono text-[9px] bg-[var(--nova-deep)] text-[var(--nova-text-muted)] rounded border border-[var(--nova-border)] shrink-0">
                ⌘K
              </kbd>
            )}
          </div>

          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg shadow-2xl max-h-[380px] overflow-y-auto no-scrollbar z-50 py-1.5">
              {filteredNav.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                    Navigation
                  </div>
                  {filteredNav.slice(0, 6).map((item) => (
                    <button
                      key={item.href}
                      onClick={() => handleSelectRoute(item.href)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--nova-deep)] flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-primary)] transition-colors">
                          {item.icon}
                        </span>
                        <span className="text-[11px] text-[var(--nova-text-primary)] group-hover:text-[var(--nova-accent)] transition-colors">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--nova-text-muted)] opacity-60 group-hover:opacity-100">
                        Jump
                      </span>
                    </button>
                  ))}
                </div>
              )} */}
{/* 
              {searchQuery.trim() !== "" && filteredTasks.length > 0 && (
                <div className="mb-2 border-t border-[var(--nova-border-muted)] pt-1.5">
                  <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)] flex items-center justify-between">
                    <span>Issues & Tasks</span>
                    <span>{filteredTasks.length} found</span>
                  </div>
                  {filteredTasks.slice(0, 5).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectRoute(`/app/tasks`)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--nova-deep)] flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-[10px] text-[var(--nova-accent)] shrink-0 font-medium">
                          {t.key}
                        </span>
                        <span className="text-[11px] text-[var(--nova-text-primary)] truncate">
                          {t.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--nova-deep)] text-[var(--nova-text-muted)] shrink-0">
                        {t.status.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              )} */}
{/* 
              {searchQuery.trim() !== "" && filteredSpecs.length > 0 && (
                <div className="mb-1 border-t border-[var(--nova-border-muted)] pt-1.5">
                  <div className="px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)]">
                    Specs & Architecture
                  </div>
                  {filteredSpecs.slice(0, 4).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelectRoute(`/app/specs`)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[var(--nova-deep)] flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="font-mono text-[10px] text-[var(--nova-ai)] shrink-0 font-medium">
                          {s.key}
                        </span>
                        <span className="text-[11px] text-[var(--nova-text-primary)] truncate">
                          {s.title}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[var(--nova-text-muted)]">
                        {s.status}
                      </span>
                    </button>
                  ))}
                </div>
              )} */}

              {/* Empty state when query produces no matches */}
              {/* {searchQuery.trim() !== "" &&
                filteredNav.length === 0 &&
                filteredTasks.length === 0 &&
                filteredSpecs.length === 0 && (
                  <div className="px-4 py-6 text-center text-[11px] text-[var(--nova-text-muted)]">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </div>
                )} */}
            {/* </div>
          )}
        </div>
 */}


        {/* Real-time notification center */}
        <NotificationCenter />

        {/* Demo Tour button (commented out as requested) */}
        {/* <button
          id="demo-tour-button"
          onClick={() => window.dispatchEvent(new Event("start-demo-tour"))}
          className="hidden sm:flex items-center gap-1.5 bg-[var(--nova-surface)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] font-medium rounded px-3 py-1.5 text-[11px] shadow-xs transition-all duration-150"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--nova-accent)]" />
          <span>Demo View</span>
        </button> */}
      </div>
    </header>
  );
};

export default WorkspaceNav;
