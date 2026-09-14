"use client";

import React, { useState } from "react";
import WorkspaceSidebar from "@/components/workspace/WorkspaceSidebar";
import WorkspaceNav from "@/components/workspace/WorkspaceNav";
import CommandPalette from "@/components/workspace/CommandPalette";
import TaskModal from "@/components/workspace/TaskModal";
import { ToastProvider } from "@/components/workspace/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";

export default function WorkspaceLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const refreshGlobal = () => {
    // Notify window or trigger re-renders
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("task-saved"));
    }
  };

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
