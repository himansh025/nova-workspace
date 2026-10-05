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
  ChevronDown,
} from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";
import { ProfileModal } from "./ProfileModal";
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
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isOrgSubmenuOpen, setIsOrgSubmenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    let headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const orgId = localStorage.getItem("nova_active_org_id");
      if (orgId) headers["x-organization-id"] = orgId;
    }

    fetch("/api/tasks", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) {
          setCounts((prev) => ({ ...prev, tasks: data.tasks.length }));
        }
      })
      .catch(() => {});

    fetch("/api/specs", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.specs) {
          setCounts((prev) => ({ ...prev, specs: data.specs.length }));
        }
      })
      .catch(() => {});
      
    fetch("/api/team", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.team) {
          setCounts((prev) => ({ ...prev, team: data.team.length }));
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

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (header: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [header]: !prev[header],
    }));
  };

  return (
    <aside
      className={`w-[240px] bg-[var(--nova-sidebar)] border-r border-[var(--nova-border)] flex flex-col select-none shrink-0 h-full ${className}`}
    >
      {/* ── Brand Logo Header ── */}
      <div className="px-4 pt-4 pb-2">
        <Link href="/" className="flex items-center group">
          <img
            src="/brand/logo-full-light.png"
            alt="Nova Workspace Logo"
            className="w-32 h-auto object-contain object-left transition-transform group-hover:scale-[1.02]"
          />
        </Link>
      </div>

      {/* ── Main nav ── (grows to fill space) */}
      <nav className="flex-1 px-2 pb-2 space-y-4 overflow-y-auto no-scrollbar mt-2">
        {navSections.map((section, si) => {
          const isCollapsed = section.header ? collapsedSections[section.header] : false;
          return (
            <div key={si}>
              {/* Section header */}
              {section.header && (
                <button
                  onClick={() => toggleSection(section.header!)}
                  className="w-full flex items-center justify-between px-3 pt-1 pb-1 hover:bg-[var(--nova-deep)] rounded transition-colors group cursor-pointer"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--nova-text-muted)] group-hover:text-[var(--nova-text-primary)] transition-colors">
                    {section.header}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-[var(--nova-text-muted)] transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
              )}
              {/* Section items */}
              <div
                className={`space-y-px overflow-hidden transition-all duration-200 ${
                  isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
                }`}
              >
                {section.items.map((item) => (
                  <NavRow key={item.href} item={item} />
                ))}
              </div>
            </div>
          );
        })}

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
      <div 
        className="bg-[var(--nova-deep)] border-t border-[var(--nova-border)] px-2 py-2 shrink-0 relative group/profile"
        onMouseEnter={() => setIsProfileDropdownOpen(true)}
        onMouseLeave={() => {
          if (!isOrgSubmenuOpen) setIsProfileDropdownOpen(false);
        }}
      >
        {/* Dropdown Menu */}
        {isProfileDropdownOpen && (
          <div className="absolute bottom-full left-2 right-2 pb-2 z-50">
            <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded shadow-xl">
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 text-[11px] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors rounded-t cursor-pointer"
              >
                Profile & Role
              </button>
              <OrgSwitcher
                asMenuItem
                onDropdownOpenChange={setIsOrgSubmenuOpen}
              />
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  void logout();
                }}
                className="w-full text-left px-3 py-2 text-[11px] text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)] transition-colors rounded-b cursor-pointer"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* User profile trigger */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          title="Edit Profile & Role"
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[var(--nova-sidebar)] text-left transition-all duration-150 group cursor-pointer"
        >
          {/* Avatar initial */}
          <div className="w-6 h-6 rounded-lg bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[11px] font-bold text-[var(--nova-accent)] shrink-0">
            {user?.initials || "U"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-medium text-[var(--nova-text-primary)] truncate group-hover:text-[var(--nova-accent)] transition-colors duration-150">
              {user?.name || "Workspace Member"}
            </span>
            <span className="text-[10px] font-mono text-[var(--nova-text-muted)] truncate">
              {user?.role || "Individual"}
            </span>
          </div>
        </button>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </aside>
  );
};

export default WorkspaceSidebar;
