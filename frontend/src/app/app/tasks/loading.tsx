import React from "react";
import { Loader2 } from "lucide-react";

export default function TasksLoading() {
  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
      <div className="h-0.5 w-full bg-[var(--nova-accent-subtle)] overflow-hidden">
        <div className="h-full bg-[var(--nova-accent)] animate-pulse w-full" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-[var(--nova-text-muted)] text-[12px] font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
          <span>Loading Tasks &amp; Board...</span>
        </div>
      </div>
    </div>
  );
}
