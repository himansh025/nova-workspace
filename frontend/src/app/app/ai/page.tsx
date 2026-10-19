"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Square,
  Plus,
  Trash2,
  GitBranch,
  FolderGit2,
  FileCode2,
  Cpu,
  Clock,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/workspace/ToastProvider";

interface Conversation {
  id: string;
  title: string;
  selectedModel: string;
  repositoryId?: string;
  branch?: string;
  createdAt: string;
  updatedAt: string;
}

interface ContextSource {
  path: string;
  size?: number;
  linesCount?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  contextMetadata?: {
    repositoryFullName?: string;
    branch?: string;
    sources?: ContextSource[];
    truncated?: boolean;
  };
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    durationMs?: number;
  };
  createdAt?: string;
}

interface Repository {
  id: string;
  fullName: string;
  defaultBranch?: string;
  selectedBranch?: string;
}

const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", tag: "Fast & Capable" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", tag: "Deep Reasoning" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", tag: "Next-Gen Fast" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", tag: "Large Context" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", tag: "Lightweight" },
];

export default function AIPage() {
  const { addToast } = useToast();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

  // Repository Context State
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [includeRepoContext, setIncludeRepoContext] = useState(false);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [availableBranches, setAvailableBranches] = useState<string[]>([]);

  // Execution State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load initial settings & repositories
  useEffect(() => {
    checkAISettings();
    fetchRepositories();
    fetchConversations();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Fetch branches when repository changes
  useEffect(() => {
    if (selectedRepoId) {
      fetchBranches(selectedRepoId);
    }
  }, [selectedRepoId]);

  const checkAISettings = async () => {
    try {
      const res = await fetch("/api/ai/settings");
      const data = await res.json();
      if (data.success && data.settings) {
        setIsConfigured(data.settings.configured);
        if (data.settings.selectedModel) {
          setSelectedModel(data.settings.selectedModel);
        }
      }
    } catch {
      setIsConfigured(false);
    }
  };

  const fetchRepositories = async () => {
    try {
      const res = await fetch("/api/integrations/github/repositories");
      const data = await res.json();
      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);
        if (data.repositories.length > 0) {
          setSelectedRepoId(data.repositories[0].id);
          setSelectedBranch(
            data.repositories[0].selectedBranch ||
              data.repositories[0].defaultBranch ||
              "main"
          );
        }
      }
    } catch (err) {
      console.error("Failed to load repositories:", err);
    }
  };

  const fetchBranches = async (repoId: string) => {
    try {
      const res = await fetch(`/api/integrations/github/repositories/${repoId}/branches`);
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        const branchNames = data.branches.map((b: any) => b.name);
        setAvailableBranches(branchNames);
        if (branchNames.length > 0 && !branchNames.includes(selectedBranch)) {
          setSelectedBranch(branchNames[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (data.conversations.length > 0 && !activeConversationId) {
          loadConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const loadConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const res = await fetch(`/api/ai/conversations/${id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        if (data.conversation?.selectedModel) {
          setSelectedModel(data.conversation.selectedModel);
        }
        if (data.conversation?.repositoryId) {
          setSelectedRepoId(data.conversation.repositoryId);
          setIncludeRepoContext(true);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const createNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          createNewConversation();
        }
        addToast({
          title: "Conversation Deleted",
          message: "The chat session has been removed.",
          type: "accent",
        });
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isGenerating) return;

    const userPrompt = inputValue.trim();
    setInputValue("");

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userPrompt,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsGenerating(true);

    // Prepare assistant placeholder
    const assistantTempId = `stream-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantTempId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          conversationId: activeConversationId || undefined,
          message: userPrompt,
          model: selectedModel,
          repositoryId: includeRepoContext ? selectedRepoId : undefined,
          branch: includeRepoContext ? selectedBranch : undefined,
          includeRepoContext,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = "";
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          streamBuffer += decoder.decode(value, { stream: true });
          const lines = streamBuffer.split("\n\n");
          streamBuffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payloadStr = line.replace(/^data:\s*/, "").trim();
              if (!payloadStr) continue;

              try {
                const event = JSON.parse(payloadStr);

                if (event.type === "start") {
                  if (!activeConversationId && event.conversationId) {
                    setActiveConversationId(event.conversationId);
                    fetchConversations();
                  }
                } else if (event.type === "chunk") {
                  accumulatedContent += event.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantTempId ? { ...m, content: accumulatedContent } : m
                    )
                  );
                } else if (event.type === "done") {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantTempId
                        ? {
                            ...m,
                            id: event.assistantMessageId,
                            content: event.fullText || accumulatedContent,
                            usage: event.usage,
                            contextMetadata: event.contextMetadata,
                          }
                        : m
                    )
                  );
                } else if (event.type === "error") {
                  throw new Error(event.error);
                }
              } catch (parseErr) {
                console.error("Stream parse error:", parseErr);
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        // User voluntarily stopped generation
        return;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantTempId
            ? {
                ...m,
                content: `⚠️ Error: ${err.message || "Failed to generate response."}`,
              }
            : m
        )
      );

      addToast({
        title: "AI Response Error",
        message: err.message || "Failed to complete AI generation.",
        type: "warning",
      });
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full bg-neutral-950 text-white overflow-hidden">
      {/* ─── SIDEBAR: SESSIONS HISTORY ────────────────────────────────────────── */}
      <div className="w-72 border-r border-white/10 bg-neutral-900/30 flex flex-col h-full shrink-0">
        {/* New Chat Button */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/10 transition"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Recent Sessions
          </div>
          {conversations.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-neutral-500">
              No saved conversations yet.
            </div>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                  activeConversationId === c.id
                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="truncate flex-1 pr-2">
                  <div className="font-medium truncate">{c.title || "Untitled Chat"}</div>
                  <div className="text-[10px] text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Cpu className="w-2.5 h-2.5" />
                    <span>{c.selectedModel || "gemini-2.5-flash"}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => deleteConversation(c.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 rounded transition"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Security Footer Info */}
        <div className="p-3 border-t border-white/10 bg-neutral-950/40 text-[11px] text-neutral-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Read-Only Bounded Context</span>
          </div>
          <p className="text-[10px] text-neutral-500">
            Nova AI has zero write access to your GitHub repositories or server shell.
          </p>
        </div>
      </div>

      {/* ─── MAIN CHAT AREA ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden">
        {/* Top Control Bar */}
        <div className="h-14 border-b border-white/10 bg-neutral-900/20 px-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Model Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-medium">Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {GEMINI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.tag})
                  </option>
                ))}
              </select>
            </div>

            {/* Repository Context Controls */}
            <div className="h-4 w-px bg-white/10 mx-1" />

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeRepoContext}
                  onChange={(e) => setIncludeRepoContext(e.target.checked)}
                  className="rounded border-white/20 text-blue-600 focus:ring-0 bg-neutral-900"
                />
                <span className="font-medium">Attach Repo Context</span>
              </label>

              {includeRepoContext && (
                <div className="flex items-center gap-2 ml-2">
                  {repositories.length > 0 ? (
                    <>
                      <select
                        value={selectedRepoId}
                        onChange={(e) => setSelectedRepoId(e.target.value)}
                        className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 max-w-[160px] truncate"
                      >
                        {repositories.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.fullName}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-neutral-300">
                        <GitBranch className="w-3 h-3 text-blue-400" />
                        <select
                          value={selectedBranch}
                          onChange={(e) => setSelectedBranch(e.target.value)}
                          className="bg-transparent border-none text-xs text-white focus:outline-none"
                        >
                          {availableBranches.map((b) => (
                            <option key={b} value={b} className="bg-neutral-900 text-white">
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <Link
                      href="/app/repositories"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <FolderGit2 className="w-3 h-3" /> Connect a Repo
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConfigured === false && (
              <Link
                href="/app/settings"
                className="flex items-center gap-1 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Configure Gemini API Key
              </Link>
            )}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-xl mx-auto py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/5">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Nova AI Copilot</h3>
                <p className="text-xs text-neutral-400">
                  Powered by Google Gemini 2.5 Flash & Pro. Ask engineering questions, analyze architecture, or inspect your connected repository files.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-left">
                {[
                  {
                    title: "Analyze Repository Architecture",
                    desc: "Inspect directory structure & package manifests",
                    prompt: "Summarize the architecture, framework, and main dependencies of this project.",
                  },
                  {
                    title: "Find Bottlenecks & Refactors",
                    desc: "Review code structure for optimizations",
                    prompt: "What are best practices to refactor and optimize the core services in this repository?",
                  },
                  {
                    title: "Draft Technical Specification",
                    desc: "Generate engineering RFC for a new feature",
                    prompt: "Draft an engineering architecture specification for adding a WebSocket event gateway.",
                  },
                  {
                    title: "Security Audit Checklist",
                    desc: "Inspect potential security edge cases",
                    prompt: "Provide a comprehensive security checklist for authentication, org isolation, and API security.",
                  },
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputValue(card.prompt);
                    }}
                    className="p-3 rounded-xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-900 hover:border-blue-500/30 text-left transition group space-y-1"
                  >
                    <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 leading-tight">
                      {card.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 max-w-4xl mx-auto ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative group rounded-2xl px-4 py-3 text-sm max-w-2xl leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-neutral-900/70 border border-white/10 text-neutral-200 rounded-bl-sm"
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                    {m.content || (
                      <span className="inline-flex items-center gap-1.5 text-neutral-400 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 animate-spin" /> Thinking...
                      </span>
                    )}
                  </div>

                  {/* Assistant Message Metadata & Provenance */}
                  {m.role === "assistant" && m.content && (
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                      <div className="flex items-center gap-3">
                        {m.usage?.totalTokens && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {m.usage.totalTokens} tokens
                          </span>
                        )}
                        {m.usage?.durationMs && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {(m.usage.durationMs / 1000).toFixed(2)}s
                          </span>
                        )}
                        {m.contextMetadata?.repositoryFullName && (
                          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            <FolderGit2 className="w-3 h-3" />
                            {m.contextMetadata.repositoryFullName} ({m.contextMetadata.branch})
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => copyToClipboard(m.content, m.id)}
                        className="p-1 rounded text-neutral-500 hover:text-white transition flex items-center gap-1 text-[10px]"
                        title="Copy text"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Context Sources Drawer (Provenance) */}
                  {m.contextMetadata?.sources && m.contextMetadata.sources.length > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-neutral-950/60 border border-white/5 space-y-1">
                      <div className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-400" />
                        <span>Included Repository Sources ({m.contextMetadata.sources.length} files):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.contextMetadata.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] text-neutral-400 bg-white/5 px-1.5 py-0.5 rounded font-mono"
                          >
                            <FileCode2 className="w-2.5 h-2.5 text-neutral-500" />
                            {s.path}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-neutral-900/30 shrink-0">
          <form
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center gap-2"
          >
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={
                isConfigured === false
                  ? "Configure Gemini API Key in Settings to start chatting..."
                  : "Ask Gemini a question about code, architecture, or repository context... (Enter to send)"
              }
              disabled={isGenerating}
              className="flex-1 bg-neutral-950 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none max-h-32"
            />

            {isGenerating ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="p-3 rounded-xl bg-red-600/80 hover:bg-red-500 text-white transition flex items-center justify-center shadow-lg shadow-red-500/10"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputValue.trim() || isGenerating}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition flex items-center justify-center shadow-lg shadow-blue-500/10"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
