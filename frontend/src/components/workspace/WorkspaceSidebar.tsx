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
  ArrowLeft,
  LogOut
} from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";
import { UserProfileModal } from "./UserProfileModal";
import { useAuth } from "@/context/AuthContext";

interface WorkspaceSidebarProps {
  className?: string;
  onCloseMobile?: () => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  className = "",
  onCloseMobile
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

  const navLinks = [
    {
      label: "Overview",
      href: "/app",
      icon: <LayoutDashboard className="w-4 h-4" />,
      exact: true
    },
    {
      label: "Tasks & Board",
      href: "/app/tasks",
      icon: <CheckSquare className="w-4 h-4" />,
      count: counts.tasks
    },
    {
      label: "Sprint Planning",
      href: "/app/sprints",
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      badge: "Sprint 24"
    },
    {
      label: "Pull Requests",
      href: "/app/pull-requests",
      icon: <GitPullRequest className="w-4 h-4 text-purple-400" />,
      badge: "3 Open"
    },
    {
      label: "Architecture Specs",
      href: "/app/specs",
      icon: <FileCode2 className="w-4 h-4" />,
      count: counts.specs
    },
    {
      label: "Service Mesh",
      href: "/app/architecture",
      icon: <Network className="w-4 h-4 text-emerald-400" />,
      badge: "6 Nodes"
    },
    {
      label: "AI Copilot",
      href: "/app/ai",
      icon: <Sparkles className="w-4 h-4 text-[var(--color-accent)]" />,
      badge: "Context Live"
    },
    {
      label: "Telemetry & Signals",
      href: "/app/insights",
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      label: "Releases & Canary",
      href: "/app/releases",
      icon: <Rocket className="w-4 h-4 text-emerald-400" />,
      badge: "v2.4.0"
    },
    {
      label: "Team Directory",
      href: "/app/team",
      icon: <Users className="w-4 h-4" />,
      count: counts.team
    },
    {
      label: "Projects",
      href: "/app/projects",
      icon: <FolderKanban className="w-4 h-4" />
    },
    {
      label: "Settings",
      href: "/app/settings",
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <aside
      className={`w-64 bg-[#0B0C0E] border-r border-white/10 flex flex-col justify-between select-none text-neutral-300 text-xs font-sans shrink-0 h-full overflow-y-auto no-scrollbar ${className}`}
    >
      <div className="p-3">
        {/* Multi-Tenant Organization Switcher */}
        <OrgSwitcher />

        {/* Navigation Group */}
        <div className="space-y-1">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-neutral-500">
            Lifecycle Modules
          </div>

          {navLinks.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all ${
                  isActive
                    ? "bg-[var(--color-accent)]/20 text-white font-medium border border-[var(--color-accent)]/40 shadow-xs"
                    : "hover:bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? "text-[var(--color-accent)]" : "text-neutral-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--color-accent)]/20 text-[var(--color-accent)] rounded border border-[var(--color-accent)]/30">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Profile & Exit to Marketing */}
      <div className="p-3 border-t border-white/10 bg-[#0E1015] space-y-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/5 transition-colors text-[11px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Website</span>
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors text-[11px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        {/* Interactive User Persona Trigger */}
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors group cursor-pointer"
          title="Manage User Profile & Identity"
        >
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">
            {user?.initials || "U"}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
              {user?.name || "Workspace Member"}
            </span>
            <span className="text-[9px] font-mono text-neutral-400 truncate">
              {(user?.role || "Engineer")} • {user ? "Authenticated" : "Active"}
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
