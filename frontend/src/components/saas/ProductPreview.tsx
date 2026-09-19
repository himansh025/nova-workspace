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
    <div
      className={`w-full rounded-2xl bg-[#0B0C0E] border border-white/10 shadow-[var(--shadow-product)] overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Top Application Window Chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0E1015] border-b border-white/10 select-none">
        {/* Window controls */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* Central Address / Project Title */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-mono text-neutral-300">
          <span className="text-neutral-500">nova://</span>
          <span>workspace/acme-core/sprint-48</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
              isAiOpen
                ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
                : "bg-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden md:inline">AI Copilot</span>
          </button>
        </div>
      </div>

      {/* Main App Interior */}
      <div className="flex h-[520px] md:h-[620px] overflow-hidden bg-[#111216]">
        {/* Left Sidebar (Desktop) */}
        <Sidebar className="hidden lg:flex" activeItem="tasks" />

        {/* Center Main Work Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TaskBoard className="flex-1" />
        </div>

        {/* Right AI Assistant Panel (Collapsible or toggleable) */}
        {isAiOpen && (
          <div className="hidden md:flex w-80 lg:w-96 shrink-0 border-l border-white/10">
            <AIPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPreview;
