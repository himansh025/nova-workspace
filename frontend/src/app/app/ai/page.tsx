"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Send,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  promptLabel?: string;
  summary?: string;
  bullets?: string[];
  actionRequired?: string;
  citations?: { key: string; title: string }[];
  timestamp: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialPrompts = [
    { id: "summarize", label: "Summarize project status & velocity" },
    { id: "find-blockers", label: "Scan for release blockers & bottlenecks" },
    { id: "draft-release", label: "Draft release notes for v2.4.0" },
    { id: "group-issues", label: "Cluster open issues by root cause" }
  ];

  const handlePresetQuery = async (presetId: string, label: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      promptLabel: label,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId, prompt: label })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: data.id || `ai-${Date.now()}`,
        sender: "ai",
        summary: data.summary,
        bullets: data.bullets,
        actionRequired: data.actionRequired,
        citations: data.citations,
        timestamp: "Just now"
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI query failed", err);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    // Initial greeting / analysis
    handlePresetQuery("summarize", "Summarize project status & velocity");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isThinking) return;

    const query = inputValue.trim();
    setInputValue("");

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      promptLabel: query,
      timestamp: "Just now"
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query })
      });
      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: data.id || `ai-${Date.now()}`,
        sender: "ai",
        summary: data.summary,
        bullets: data.bullets,
        actionRequired: data.actionRequired,
        citations: data.citations,
        timestamp: "Just now"
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Custom AI query failed", err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200">
      {/* Header Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)]">
              <Sparkles className="w-3 h-3" />
            </div>
            <h1 className="text-xl font-semibold text-white">NOVA Context Engine</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Realtime multi-repo semantic graph • Grounded in open issues, specs, and telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Vector Context Live: main@4f81c9a</span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            {msg.sender === "user" ? (
              /* User Bubble */
              <div className="flex items-start justify-end gap-2.5">
                <div className="bg-[var(--color-accent)] text-white px-4 py-2.5 rounded-xl rounded-tr-xs text-xs max-w-lg shadow-sm">
                  {msg.promptLabel}
                </div>
                <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                  ER
                </div>
              </div>
            ) : (
              /* AI Response Bubble */
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 bg-[#161822] border border-white/10 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-sm text-xs text-neutral-200">
                  {/* Summary Statement */}
                  <div className="text-white font-medium leading-relaxed text-xs sm:text-sm">
                    {msg.summary}
                  </div>

                  {/* Bullet Insights */}
                  {msg.bullets && msg.bullets.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      {msg.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-neutral-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action Required Block */}
                  {msg.actionRequired && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2.5 text-amber-300 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5 text-amber-200">
                          Recommended Action
                        </span>
                        <span className="leading-relaxed">{msg.actionRequired}</span>
                      </div>
                    </div>
                  )}

                  {/* Citations / Links to Real Issues */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-neutral-500 mr-1">
                        Indexed Issues:
                      </span>
                      {msg.citations.map((c) => (
                        <Link
                          key={c.key}
                          href="/app/tasks"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-[var(--color-accent)] transition-colors"
                        >
                          <span>{c.key}</span>
                          <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent)] shrink-0 mt-1">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="bg-[#161822] border border-white/10 rounded-xl p-4 text-xs font-mono text-neutral-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[var(--color-accent)]" />
              <span>Synthesizing repository graph, open issues, and pull requests...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Preset Inquiries & Custom Input */}
      <div className="p-4 sm:p-5 border-t border-white/10 bg-[#0E1015] shrink-0 space-y-3 max-w-4xl mx-auto w-full">
        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-neutral-500 mr-1">
            Quick Inquiries:
          </span>
          {initialPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetQuery(p.id, p.label)}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[11px] text-neutral-300 hover:text-white transition-all flex items-center gap-1"
            >
              <span>{p.label}</span>
              <ArrowUpRight className="w-2.5 h-2.5 opacity-50" />
            </button>
          ))}
        </div>

        {/* Custom Input Bar */}
        <form onSubmit={handleSendCustom} className="flex items-center gap-2">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask NOVA about issues, PRs, architecture, or code..."
              className="w-full px-4 py-2.5 rounded-lg bg-[#161820] border border-white/10 text-white placeholder-neutral-500 text-xs focus:outline-hidden focus:border-[var(--color-accent)] pr-10"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            className="p-2.5 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
