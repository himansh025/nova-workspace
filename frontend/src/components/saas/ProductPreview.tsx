"use client";

import React, { useState } from "react";
import Sidebar from "@/components/product-ui/Sidebar";
import TaskBoard from "@/components/product-ui/TaskBoard";
import AIPanel from "@/components/product-ui/AIPanel";
import { Sparkles } from "lucide-react";

interface ProductPreviewProps {
  className?: string;
}

export const ProductPreview: React.FC<ProductPreviewProps> = ({
  className = ""
}) => {
  const [isAiOpen, setIsAiOpen] = useState(true);

  return (
    /* Premium Framed Outer Container */
    <div
      className={`w-full p-2.5 sm:p-3.5 rounded-3xl bg-[var(--landing-surface-muted)] border border-[var(--landing-border-strong)] shadow-[0_20px_50px_rgba(23,23,23,0.08)] transition-all duration-300 ${className}`}
    >
      {/* Actual Dark Inner Workspace Application UI */}
      <div className="w-full rounded-2xl bg-[var(--nova-bg)] border border-[var(--nova-border)] shadow-2xl overflow-hidden">
        {/* Top Application Window Chrome */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--nova-sidebar)] border-b border-[var(--nova-border)] select-none">
          {/* Window controls */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          {/* Central Address / Project Title */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-[var(--nova-elevated)] border border-[var(--nova-border-muted)] text-[11px] font-mono text-[var(--nova-text-primary)]">
            <span className="text-[var(--nova-text-muted)]">nova://</span>
            <span>workspace/acme-core/sprint-48</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
          </div>

          {/* Action controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiOpen(!isAiOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                isAiOpen
                  ? "bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] border border-[var(--landing-primary)]/40"
                  : "bg-[var(--nova-elevated)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Main App Interior */}
        <div className="flex h-[520px] md:h-[620px] overflow-hidden bg-[var(--nova-bg)]">
          {/* Left Sidebar (Desktop) */}
          <Sidebar className="hidden lg:flex" activeItem="tasks" />

          {/* Center Main Work Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <TaskBoard className="flex-1" />
          </div>

          {/* Right AI Assistant Panel (Collapsible or toggleable) */}
          {isAiOpen && (
            <div className="hidden md:flex w-80 lg:w-96 shrink-0 border-l border-[var(--nova-border)]">
              <AIPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductPreview;
