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
  const hasInitialized = useRef(false);

  const generateId = (prefix: "usr" | "ai") =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const initialPrompts = [
    { id: "summarize", label: "Summarize project status & velocity" },
    { id: "find-blockers", label: "Scan for release blockers & bottlenecks" },
    { id: "draft-release", label: "Draft release notes for v2.4.0" },
    { id: "group-issues", label: "Cluster open issues by root cause" }
  ];

  const handlePresetQuery = async (presetId: string, label: string) => {
    const userMsg: ChatMessage = {
      id: generateId("usr"),
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
        id: data.id || generateId("ai"),
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
    if (hasInitialized.current) return;
    hasInitialized.current = true;
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
      id: generateId("usr"),
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
        id: data.id || generateId("ai"),
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
    <div className="flex flex-col h-full bg-[var(--nova-bg)] text-[var(--nova-text-primary)]">
      {/* ── Conversation stream ── */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 w-full nova-scroll">
        {messages.map((msg, idx) => (
          <div key={`${msg.id}-${idx}`}>
            {msg.sender === "user" ? (
              /* ── User bubble ── */
              <div className="flex items-start justify-end gap-2.5">
                <div className="bg-[var(--nova-accent)] text-white px-3.5 py-2 rounded-lg rounded-br-sm text-[12px] max-w-lg shadow-xs leading-relaxed">
                  {msg.promptLabel}
                </div>
                {/* User avatar */}
                <div className="w-6 h-6 rounded-full bg-[var(--nova-surface)] border border-[var(--nova-border)] flex items-center justify-center text-[9px] font-bold text-[var(--nova-text-secondary)] shrink-0 mt-0.5">
                  ME
                </div>
              </div>
            ) : (
              /* ── AI response ── */
              <div className="flex items-start gap-3">
                {/* AI icon badge */}
                <div className="w-7 h-7 bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] rounded-md flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-[13px] h-[13px] text-[var(--nova-ai)]" />
                </div>

                {/* Content card */}
                <div className="flex-1 bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-4 space-y-3">
                  {/* Summary */}
                  {msg.summary && (
                    <p className="text-[12px] text-[var(--nova-text-primary)] leading-relaxed">
                      {msg.summary}
                    </p>
                  )}

                  {/* Bullet insights */}
                  {msg.bullets && msg.bullets.length > 0 && (
                    <div className="border-t border-[var(--nova-border-muted)] pt-2.5 space-y-1.5">
                      {msg.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2 text-[11px] text-[var(--nova-text-secondary)]">
                          <CheckCircle className="w-3 h-3 text-[var(--nova-success)] shrink-0 mt-0.5" />
                          <span className="leading-snug">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action required block */}
                  {msg.actionRequired && (
                    <div className="bg-[var(--nova-warning-subtle)] border-l-2 border-[var(--nova-warning)] rounded-r-md p-3 flex items-start gap-2 text-[var(--nova-warning-text)]">
                      <AlertTriangle className="w-[13px] h-[13px] text-[var(--nova-warning)] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-medium text-[var(--nova-warning-text)] mb-0.5">
                          Recommended Action
                        </p>
                        <p className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">
                          {msg.actionRequired}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Citations footer */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="border-t border-[var(--nova-border-muted)] pt-2.5 flex flex-wrap gap-1.5 items-center">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--nova-text-muted)] mr-0.5">
                        Sources:
                      </span>
                      {msg.citations.map((c) => (
                        <Link
                          key={c.key}
                          href="/app/tasks"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--nova-deep)] border border-[var(--nova-border)] hover:border-[var(--nova-accent-border)] hover:bg-[var(--nova-accent-subtle)] text-[var(--nova-accent)] rounded font-mono text-[10px] transition-colors duration-150"
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

        {/* ── Thinking indicator ── */}
        {isThinking && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] rounded-md flex items-center justify-center shrink-0 mt-1">
              <Sparkles className="w-[13px] h-[13px] text-[var(--nova-ai)]" />
            </div>
            <div className="flex-1 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 space-y-3 shadow-xs">
              {/* Synthesizing status */}
              <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--nova-ai)]">
                <RefreshCw className="w-3 h-3 animate-spin text-[var(--nova-ai)]" />
                <span>Synthesizing...</span>
              </div>
              {/* Skeleton lines */}
              <div className="space-y-2">
                <div className="bg-[var(--nova-border-muted)] rounded h-3 w-full animate-pulse" />
                <div className="bg-[var(--nova-border-muted)] rounded h-3 w-4/5 animate-pulse" />
                <div className="bg-[var(--nova-border-muted)] rounded h-3 w-3/5 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom input area ── */}
      <div className="px-5 py-4 border-t border-[var(--nova-border)] bg-[var(--nova-surface)] shrink-0 space-y-3 w-full">
        {/* Quick prompt pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--nova-text-muted)]">
            Quick Prompts
          </span>
          {initialPrompts.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetQuery(p.id, p.label)}
              disabled={isThinking}
              className="bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-ai-text)] hover:bg-[var(--nova-ai-subtle)] rounded px-2.5 py-1 text-[11px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom input form */}
        <form onSubmit={handleSendCustom} className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask NOVA about issues, PRs, architecture, or code..."
            className="flex-1 bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] focus:border-[var(--nova-accent)] rounded-md px-3.5 py-2 text-[12px] placeholder-[var(--nova-text-muted)] outline-none transition-colors duration-150"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            className="bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed p-2 rounded text-white transition-colors duration-150 shrink-0"
          >
            <Send className="w-[14px] h-[14px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
