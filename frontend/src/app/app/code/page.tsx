"use client";

import React from "react";
import { FolderGit2, ShieldCheck } from "lucide-react";
import { RepositoryExplorerMain } from "@/components/workspace/explorer/RepositoryExplorerMain";

export default function RepositoryExplorerPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--nova-border)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[var(--nova-text-primary)]">Repository Explorer</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-medium">
              READ-ONLY
            </span>
          </div>
          <p className="text-xs text-[var(--nova-text-secondary)] mt-1">
            Browse connected GitHub repositories, navigate source directories, view code files, perform repository-scoped searches, and inspect commit history.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-xs text-[var(--nova-text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Token Exchange</span>
          </div>
        </div>
      </div>

      {/* Main Explorer Workspace */}
      <RepositoryExplorerMain />
    </div>
  );
}
