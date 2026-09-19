"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import WorkspaceNav from "@/components/workspace/WorkspaceNav";
import CommandPalette from "@/components/workspace/CommandPalette";
import TaskModal from "@/components/workspace/TaskModal";
import { ToastProvider } from "@/components/workspace/ToastProvider";
import { useAuth } from "@/context/AuthContext";

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0C0E] text-neutral-200">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-mono text-neutral-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
          Verifying session...
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0B0C0E] text-neutral-200 font-sans">
      {/* Persistent Sidebar (Desktop) */}
      <WorkspaceSidebar className="hidden lg:flex" />

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full bg-[#0B0C0E] shadow-2xl">
            <WorkspaceSidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <WorkspaceNav
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNewTaskModal={() => setIsNewTaskModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#111216] relative no-scrollbar">
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
      />
      </div>
    </ToastProvider>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
