"use client";

import React, { useState } from "react";
import { Sparkles, ArrowUpRight, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { interactiveAiPrompts } from "@/data/product-demo";

interface AIPanelProps {
  className?: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ className = "" }) => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>("summarize");
  const [isThinking, setIsThinking] = useState<boolean>(false);

  const activePrompt =
    interactiveAiPrompts.find((p) => p.id === selectedPromptId) ||
    interactiveAiPrompts[0];

  const handleSelectPrompt = (id: string) => {
    if (id === selectedPromptId) return;
    setIsThinking(true);
    setSelectedPromptId(id);
    setTimeout(() => {
      setIsThinking(false);
    }, 450);
  };

  return (
    <div
      className={`w-full h-full bg-[var(--nova-sidebar)] border-l border-[var(--nova-border)] flex flex-col justify-between text-[var(--nova-text-primary)] text-xs overflow-hidden ${className}`}
    >
      {/* AI Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-sidebar)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-[var(--landing-primary)]/20 border border-[var(--landing-primary)]/40 flex items-center justify-center text-[var(--landing-primary)]">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="font-medium text-[var(--nova-text-primary)] text-xs">NOVA Context Engine</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--landing-success)] bg-[var(--landing-success-subtle)] px-2 py-0.5 rounded border border-[var(--landing-success)]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--landing-success)] animate-pulse" />
          <span>Synced: main@4f81c9a</span>
        </div>
      </div>

      {/* Main Conversation & Output area */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {/* User Query Bubble */}
        <div className="flex flex-col items-end">
          <div className="bg-[var(--landing-primary)] text-[var(--nova-text-primary)] px-3.5 py-2 rounded-xl rounded-tr-xs max-w-[90%] text-xs shadow-xs font-medium">
            {activePrompt.label}
          </div>
          <span className="text-[9px] font-mono text-[var(--nova-text-muted)] mt-1">
            Grounded in 4 repos & 28 issues
          </span>
        </div>

        {/* AI Output Card */}
        <div className="bg-[var(--nova-elevated)] border border-[var(--nova-border)] rounded-lg p-3.5 space-y-3">
          {isThinking ? (
            <div className="flex items-center gap-2 py-6 text-[var(--nova-text-secondary)] font-mono text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--landing-primary)]" />
              <span>Synthesizing repository graph & dependency tree...</span>
            </div>
          ) : (
            <>
              {/* Summary Statement */}
              <div className="text-[var(--nova-text-primary)] text-xs font-medium leading-relaxed">
                {activePrompt.response.summary}
              </div>

              {/* Bullet Points */}
              <div className="space-y-1.5 pt-1">
                {activePrompt.response.bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] text-[var(--nova-text-primary)]">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--landing-success)] shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Action item block */}
              {activePrompt.response.actionRequired && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2.5 flex items-start gap-2 text-[11px] text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5 text-amber-200">
                      Recommended Next Step
                    </span>
                    <span>{activePrompt.response.actionRequired}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="pt-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--nova-text-muted)] mb-2">
            Suggested Context Inquiries
          </div>
          <div className="flex flex-wrap gap-1.5">
            {interactiveAiPrompts.map((p) => {
              const isSelected = p.id === selectedPromptId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPrompt(p.id)}
                  className={`px-2.5 py-1.5 rounded text-[11px] font-sans transition-all text-left flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[var(--landing-primary)] text-[var(--nova-text-primary)] font-medium border border-[var(--landing-primary)]"
                      : "bg-[var(--nova-elevated)] hover:bg-[var(--nova-surface)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] border border-[var(--nova-border-muted)]"
                  }`}
                >
                  <span>{p.label}</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input box bottom */}
      <div className="p-3 border-t border-[var(--nova-border)] bg-[var(--nova-sidebar)]">
        <div className="flex items-center justify-between bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-md px-3 py-2 text-xs">
          <span className="text-[var(--nova-text-muted)]">Ask NOVA about issues, PRs, or architecture...</span>
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono bg-[var(--nova-surface)] text-[var(--nova-text-secondary)] rounded">
            Return ↵
          </kbd>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
