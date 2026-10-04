"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import WorkspaceNav from "@/components/workspace/WorkspaceNav";
import CommandPalette from "@/components/workspace/CommandPalette";
import TaskModal from "@/components/workspace/TaskModal";
import TourGuide from "@/components/workspace/TourGuide";
import { ToastProvider } from "@/components/workspace/ToastProvider";
import { useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskProjectId, setNewTaskProjectId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const refreshGlobal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("task-saved"));
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
        <div className="flex items-center gap-3 rounded-full border border-[var(--nova-border)] bg-[var(--nova-surface)] px-4 py-2 text-xs font-mono text-[var(--nova-text-secondary)]">
          <span className="h-2 w-2 rounded-full bg-[var(--nova-accent)] animate-pulse" />
          Verifying session...
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[var(--nova-bg)] text-[var(--nova-text-primary)] font-sans">
        {/* Persistent Sidebar (Desktop) */}
        {isDesktopSidebarOpen && (
          <WorkspaceSidebar className="hidden lg:flex" />
        )}

        {/* Mobile Sidebar Overlay Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative z-10 w-64 h-full bg-[var(--nova-sidebar)] shadow-2xl">
              <WorkspaceSidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Workspace Frame */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Top Header Bar */}
          <WorkspaceNav
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenNewTaskModal={(pid) => { setNewTaskProjectId(pid || null); setIsNewTaskModalOpen(true); }}
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            onToggleDesktopSidebar={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
          />

          {/* Content Viewport */}
          <main className="flex-1 overflow-y-auto bg-[var(--nova-bg)] relative no-scrollbar">
            {children}
          </main>
        </div>

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />

        {/* Global New Issue Creation Modal */}
        <TaskModal
          isOpen={isNewTaskModalOpen}
          onClose={() => setIsNewTaskModalOpen(false)}
          onTaskSaved={refreshGlobal}
          projectId={newTaskProjectId || undefined}
        />
        
        {/* Product Tour Guide */}
        <TourGuide />
      </div>
    </ToastProvider>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </ThemeProvider>
  );
}
