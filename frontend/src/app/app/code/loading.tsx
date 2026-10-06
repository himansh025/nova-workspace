import React from "react";
import { FolderGit2, RefreshCw } from "lucide-react";

export default function RepositoryExplorerLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[var(--nova-border)] animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-[var(--nova-deep)] rounded" />
          <div className="h-3 w-72 bg-[var(--nova-deep)] rounded" />
        </div>
      </div>

      <div className="p-12 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] flex flex-col items-center justify-center gap-3 text-xs text-[var(--nova-text-muted)] min-h-[500px]">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--nova-accent)]" />
        <span className="font-mono">Initializing Repository Explorer...</span>
      </div>
    </div>
  );
}
