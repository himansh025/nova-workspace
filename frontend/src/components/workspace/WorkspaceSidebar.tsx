"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Zap,
  GitPullRequest,
  FileCode2,
  Network,
  Sparkles,
  TrendingUp,
  Rocket,
  Users,
  FolderKanban,
  Settings,
  LogOut,
} from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";
import { UserProfileModal } from "./UserProfileModal";
import { useAuth } from "@/context/AuthContext";

interface WorkspaceSidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
  /** Show a neutral count badge */
  count?: number;
  /** Show a tiny accent dot instead of a text badge */
  isNew?: boolean;
  /** Override icon color class (for AI accent, etc.) */
  iconClass?: string;
}

interface NavSection {
  /** Section header label — undefined means no header rendered */
  header?: string;
  items: NavItem[];
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  className = "",
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [counts, setCounts] = useState<{ tasks: number; specs: number; team: number }>({
    tasks: 0,
    specs: 0,
    team: 1,
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) {
          setCounts((prev) => ({ ...prev, tasks: data.tasks.length }));
        }
      })
      .catch(() => {});

    fetch("/api/specs")
      .then((res) => res.json())
      .then((data) => {
        if (data.specs) {
          setCounts((prev) => ({ ...prev, specs: data.specs.length }));
        }
      })
      .catch(() => {});
  }, [pathname]);

  /** Organized nav sections per design spec */
  const navSections: NavSection[] = [
    {
      // Section 1 — ENGINEERING (primary, no header label)
      items: [
        {
          label: "Overview",
          href: "/app",
          icon: <LayoutDashboard size={14} />,
          exact: true,
        },
        {
          label: "Tasks & Board",
          href: "/app/tasks",
          icon: <CheckSquare size={14} />,
          count: counts.tasks,
        },
        {
          label: "Sprint Planning",
          href: "/app/sprints",
          icon: <Zap size={14} />,
        },
        {
          label: "Pull Requests",
          href: "/app/pull-requests",
          icon: <GitPullRequest size={14} />,
        },
      ],
    },
    {
      // Section 2 — ARCHITECTURE
      header: "Architecture",
      items: [
        {
          label: "Architecture Specs",
          href: "/app/specs",
          icon: <FileCode2 size={14} />,
          count: counts.specs,
        },
        {
          label: "Service Mesh",
          href: "/app/architecture",
          icon: <Network size={14} />,
        },
      ],
    },
    {
      // Section 3 — INTELLIGENCE (AI gets violet icon text-[var(--nova-ai)])
      header: "Intelligence",
      items: [
        {
          label: "AI Copilot",
          href: "/app/ai",
          icon: <Sparkles size={14} />,
          iconClass: "text-[var(--nova-ai)]",
        },
        {
          label: "Telemetry & Signals",
          href: "/app/insights",
          icon: <TrendingUp size={14} />,
        },
      ],
    },
    {
      // Section 4 — OPERATIONS
      header: "Operations",
      items: [
        {
          label: "Releases & Canary",
          href: "/app/releases",
          icon: <Rocket size={14} />,
        },
        {
          label: "Projects",
          href: "/app/projects",
          icon: <FolderKanban size={14} />,
        },
        {
          label: "Team Directory",
          href: "/app/team",
          icon: <Users size={14} />,
          count: counts.team,
        },
      ],
    },
  ];

  /** Determine if a nav item is active */
  const isItemActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  /** Render a single nav row */
  const NavRow = ({ item }: { item: NavItem }) => {
    const active = isItemActive(item);
    return (
      <Link
        href={item.href}
        onClick={onCloseMobile}
        className={`relative flex items-center justify-between px-3 py-[7px] rounded transition-all duration-150 group ${
          active
            ? "border-l-2 border-[var(--nova-accent)] bg-[var(--nova-accent-subtle)] text-[var(--nova-text-primary)] font-medium pl-[10px]"
            : "border-l-2 border-transparent text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] pl-[10px]"
        }`}
      >
        {/* Icon + Label */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 transition-colors duration-150 ${
              item.iconClass
                ? item.iconClass
                : active
                ? "text-[var(--nova-accent)]"
                : "text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-primary)]"
            }`}
          >
            {item.icon}
          </span>
          <span
            className={`text-[11px] truncate transition-colors duration-150 ${
              active
                ? "text-[var(--nova-text-primary)] font-medium"
                : "text-[var(--nova-text-secondary)] group-hover:text-[var(--nova-text-primary)]"
            }`}
          >
            {item.label}
          </span>
        </div>

        {/* Right-side decorators */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Accent dot for 'new' items */}
          {item.isNew && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-accent)] shrink-0" />
          )}
          {/* Neutral count badge */}
          {item.count !== undefined && (
            <span className="font-mono text-[10px] bg-[var(--nova-deep)] text-[var(--nova-text-muted)] px-1.5 py-0.5 rounded leading-none">
              {item.count}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <aside
      className={`w-[240px] bg-[var(--nova-sidebar)] border-r border-[var(--nova-border)] flex flex-col select-none shrink-0 h-full overflow-y-auto no-scrollbar ${className}`}
    >
      {/* ── Brand Logo & OrgSwitcher Header ── */}
      <div className="px-3 pt-3 space-y-2">
        <Link href="/" className="flex items-center px-1 py-1 group">
          <img
            src="/brand/logo-mark.png"
            alt="Nova Workspace Logo"
            className="h-7 w-auto object-contain transition-transform group-hover:scale-[1.05]"
          />
        </Link>
        <OrgSwitcher />
      </div>

      {/* ── Main nav ── (grows to fill space) */}
      <nav className="flex-1 px-2 pb-2 space-y-4 overflow-y-auto no-scrollbar">
        {navSections.map((section, si) => (
          <div key={si}>
            {/* Section header */}
            {section.header && (
              <div className="px-3 pt-1 pb-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--nova-text-muted)]">
                  {section.header}
                </span>
              </div>
            )}
            {/* Section items */}
            <div className="space-y-px">
              {section.items.map((item) => (
                <NavRow key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Divider before Settings */}
        <div className="border-t border-[var(--nova-border)] pt-1">
          <NavRow
            item={{
              label: "Settings",
              href: "/app/settings",
              icon: <Settings size={14} />,
            }}
          />
        </div>
      </nav>

      {/* ── Bottom: user area (pinned) ── */}
      <div className="bg-[var(--nova-deep)] border-t border-[var(--nova-border)] px-2 py-2 space-y-1 shrink-0">
        {/* Sign Out — ghost danger treatment */}
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-[11px] text-[var(--nova-text-muted)] hover:text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)] transition-all duration-150"
        >
          <LogOut size={13} />
          <span>Sign Out</span>
        </button>

        {/* User profile trigger */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          title="Manage User Profile & Identity"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[var(--nova-sidebar)] text-left transition-all duration-150 group cursor-pointer"
        >
          {/* Avatar initial — rounded-lg with initials in accent color bg var(--nova-accent-subtle) text var(--nova-accent) */}
          <div className="w-6 h-6 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[11px] font-bold text-[var(--nova-accent)] shrink-0">
            {user?.initials || "U"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-medium text-[var(--nova-text-primary)] truncate group-hover:text-[var(--nova-accent)] transition-colors duration-150">
              {user?.name || "Workspace Member"}
            </span>
            <span className="text-[10px] font-mono text-[var(--nova-text-muted)] truncate">
              {user?.role || "Engineer"}
            </span>
          </div>
        </button>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};

export default WorkspaceSidebar;
