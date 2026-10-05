"use client";

import React, { useState, useEffect } from "react";
import {
  FileCode2,
  Plus,
  Edit3,
  Trash2,
  Save,
  Check,
  X,
  Sparkles,
  Copy,
  Code2,
  Play,
  Search,
} from "lucide-react";
import { Spec, SpecStatus } from "@/types";
import { CodeSandboxModal } from "@/components/workspace/CodeSandboxModal";
import { SpecsSkeleton } from "@/components/workspace/Skeletons";

/* ─────────────────────────────────────────────
   Status badge helper — spec-specific palette
───────────────────────────────────────────── */
function SpecStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:
      "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]",
    review:
      "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]",
    draft:
      "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]",
    drafting:
      "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]",
  };
  const cls = map[status] ?? map.draft;
  return (
    <span
      className={`${cls} rounded px-1.5 py-0.5 text-[10px] font-medium capitalize`}
    >
      {status}
    </span>
  );
}

export default function SpecsPage() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isNewSpecModalOpen, setIsNewSpecModalOpen] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // New spec form
  const [newTitle, setNewTitle] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newContent, setNewContent] = useState("");

  const fetchSpecs = async () => {
    try {
      const res = await fetch("/api/specs");
      const data = await res.json();
      if (data.specs) {
        setSpecs(data.specs);
        if (!selectedSpec && data.specs.length > 0) {
          setSelectedSpec(data.specs[0]);
          setEditContent(data.specs[0].content);
          setEditTitle(data.specs[0].title);
        }
      }
    } catch (err) {
      console.error("Error fetching specs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleSelectSpec = (spec: Spec) => {
    setSelectedSpec(spec);
    setEditContent(spec.content);
    setEditTitle(spec.title);
    setIsEditing(false);
  };

  const handleUpdateStatus = async (status: SpecStatus) => {
    if (!selectedSpec) return;
    try {
      const res = await fetch(`/api/specs/${selectedSpec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.spec) {
        setSelectedSpec(data.spec);
        setSpecs((prev) =>
          prev.map((s) => (s.id === data.spec.id ? data.spec : s))
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSpec) return;
    try {
      const res = await fetch(`/api/specs/${selectedSpec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const data = await res.json();
      if (data.spec) {
        setSelectedSpec(data.spec);
        setSpecs((prev) =>
          prev.map((s) => (s.id === data.spec.id ? data.spec : s))
        );
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save spec edit", err);
    }
  };

  const handleDeleteSpec = async (id: string) => {
    if (!confirm("Are you sure you want to delete this specification?")) return;
    try {
      await fetch(`/api/specs/${id}`, { method: "DELETE" });
      const remaining = specs.filter((s) => s.id !== id);
      setSpecs(remaining);
      setSelectedSpec(remaining[0] || null);
    } catch (err) {
      console.error("Failed to delete spec", err);
    }
  };

  const handleCreateSpec = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;
    try {
      const res = await fetch("/api/specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          summary: newSummary,
          content: newContent || newSummary,
          tags: ["Architecture", "Plan"],
        }),
      });
      const data = await res.json();
      if (data.spec) {
        setSpecs([data.spec, ...specs]);
        setSelectedSpec(data.spec);
        setIsNewSpecModalOpen(false);
        setNewTitle("");
        setNewSummary("");
        setNewContent("");
      }
    } catch (err) {
      console.error("Failed to create spec", err);
    }
  };

  const handleGenerateCode = async () => {
    if (!selectedSpec) return;
    setIsGeneratingCode(true);
    try {
      const res = await fetch("/api/ai/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specId: selectedSpec.id, language: "typescript" }),
      });
      const data = await res.json();
      if (data.codeSnippet) {
        setGeneratedCode(data.codeSnippet);
      }
    } catch (err) {
      console.error("Code generation failed", err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredSpecs = specs.filter((s) => {
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.key?.toLowerCase().includes(q) ||
      s.summary?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <SpecsSkeleton />;
  }

  /* ─── Filter pill classes ─── */
  const filterCls = (val: string) =>
    filterStatus === val
      ? "bg-[var(--nova-accent-subtle)] text-[var(--nova-accent-text)] border border-[var(--nova-accent-border)]"
      : "text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] border border-transparent";

  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)]">
      {/* ── Page Header ── */}
      <div className="px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] text-[var(--nova-text-primary)] flex items-center justify-between shrink-0 gap-3">
        {/* Left: title + subtitle */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0" />
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)] leading-none">
              Architecture Specs
            </h1>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)] bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] px-1.5 py-0.5 rounded hidden sm:inline">
              Plan Engine
            </span>
          </div>
          <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5 leading-none hidden sm:block">
            Link requirements to pull requests, vector clocks, and schema migrations
          </p>
        </div>

        {/* Right: search + filter tabs + new button */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 ml-auto">
          {/* Search (Wider!) */}
          <div className="relative flex items-center min-w-[180px] w-full sm:w-64 md:w-80">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--nova-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search specs by title or key…"
              className="pl-8 pr-3 py-1.5 w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[12px] text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] outline-none transition-colors duration-150 h-8"
            />
          </div>

          {/* Status filters (Purely Right) */}
          <div className="flex items-center gap-0.5 bg-[var(--nova-bg)] border border-[var(--nova-border-muted)] rounded-md p-0.5 h-8">
            {[
              { val: "all", label: `All ${specs.length}` },
              { val: "approved", label: "Approved" },
              { val: "review", label: "Review" },
              { val: "draft", label: "Draft" },
            ].map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilterStatus(val)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150 cursor-pointer ${filterCls(val)}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* New Spec */}
          <button
            onClick={() => setIsNewSpecModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded-md text-[12px] font-medium transition-colors duration-150 cursor-pointer h-8 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Spec</span>
          </button>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left Pane: Spec List ── */}
        <div className="w-full md:w-72 lg:w-80 border-r border-[var(--nova-border)] bg-[var(--nova-surface)] flex flex-col shrink-0 overflow-y-auto nova-scroll">
          {filteredSpecs.map((spec) => {
            const isSelected = selectedSpec?.id === spec.id;
            return (
              <div
                key={spec.id}
                onClick={() => handleSelectSpec(spec)}
                className={`relative px-4 py-3 border-b border-[var(--nova-border-muted)] flex items-start gap-3 cursor-pointer group transition-colors duration-150 ${
                  isSelected
                    ? "bg-[rgba(99,102,241,0.08)] border-l-2 border-l-[#6366F1]"
                    : "hover:bg-[var(--nova-deep)] border-l-2 border-l-transparent"
                }`}
              >
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* Key + status row */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-accent)]">
                      {spec.key}
                    </span>
                    <SpecStatusBadge status={spec.status} />
                  </div>

                  {/* Title */}
                  <h3 className="text-[13px] font-medium text-[var(--nova-text-primary)] line-clamp-1 leading-snug mb-0.5">
                    {spec.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-[11px] text-[var(--nova-text-muted)] line-clamp-1 leading-relaxed mb-1.5">
                    {spec.summary}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between font-mono text-[10px] text-[var(--nova-text-muted)]">
                    <span>{spec.author.name}</span>
                    <span>{new Date(spec.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSpecs.length === 0 && (
            <div className="p-8 text-center">
              <p className="font-mono text-[11px] text-[var(--nova-text-muted)]">No specs match the current filter.</p>
            </div>
          )}
        </div>

        {/* ── Right Pane: Detail View ── */}
        <div className="hidden md:flex flex-1 flex-col bg-[var(--nova-surface)] border-l border-[var(--nova-border)] overflow-hidden">
          {selectedSpec ? (
            <div className="flex flex-col h-full">
              {/* Detail Header */}
              <div className="px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-center justify-between shrink-0 gap-3">
                {/* Left: key + title + status */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--nova-accent)] shrink-0">
                    {selectedSpec.key}
                  </span>
                  <span className="text-[var(--nova-text-muted)]">·</span>
                  <span className="text-[13px] font-medium text-[var(--nova-text-primary)] truncate">
                    {selectedSpec.title}
                  </span>
                  <SpecStatusBadge status={selectedSpec.status} />
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Status progression */}
                  {selectedSpec.status === "drafting" ? (
                    <button
                      onClick={() => handleUpdateStatus("review")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-info-subtle)] hover:bg-[rgba(14,165,233,0.18)] border border-[var(--nova-info-border)] text-[var(--nova-info-text)] rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      <span>Submit for Review</span>
                    </button>
                  ) : null}

                  {selectedSpec.status !== "approved" && (
                    <button
                      onClick={() => handleUpdateStatus("approved")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-success-subtle)] hover:bg-[rgba(16,185,129,0.18)] border border-[var(--nova-success-border)] text-[var(--nova-success-text)] rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {/* AI: Generate Code — violet */}
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-ai-subtle)] hover:bg-[rgba(139,92,246,0.18)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingCode ? "Generating…" : "AI Code"}</span>
                  </button>

                  {/* Live Sandbox */}
                  <button
                    onClick={() => {
                      if (!generatedCode) {
                        handleGenerateCode().then(() => setIsSandboxOpen(true));
                      } else {
                        setIsSandboxOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-success-subtle)] hover:bg-[rgba(16,185,129,0.18)] border border-[var(--nova-success-border)] text-[var(--nova-success-text)] rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Sandbox</span>
                  </button>

                  {/* Edit / Save toggle */}
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteSpec(selectedSpec.id)}
                    title="Delete Specification"
                    className="p-1.5 rounded text-[var(--nova-text-muted)] hover:text-[var(--nova-danger-text)] hover:bg-[var(--nova-danger-subtle)] transition-colors duration-150 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto nova-scroll px-6 py-5">
                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-4 max-w-3xl">
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                        Specification Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[var(--nova-text-primary)] text-[13px] outline-none transition-colors duration-150"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                        Specification Content (Markdown)
                      </label>
                      <textarea
                        rows={18}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[var(--nova-text-primary)] font-mono text-[11px] outline-none transition-colors duration-150 resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  /* ── Read mode ── */
                  <div className="max-w-3xl space-y-5">
                    {/* Title + meta */}
                    <div>
                      <h1 className="text-[18px] font-semibold text-[var(--nova-text-primary)] tracking-tight leading-snug mb-2">
                        {selectedSpec.title}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-[var(--nova-text-muted)]">
                        <span>Lead: {selectedSpec.author.name}</span>
                        <span className="text-[var(--nova-border-strong)]">·</span>
                        <span>Created {new Date(selectedSpec.createdAt).toLocaleDateString()}</span>
                        <span className="text-[var(--nova-border-strong)]">·</span>
                        <span className="text-[var(--nova-success-text)]">Board Consensus Met</span>
                        {selectedSpec.tags?.length > 0 && (
                          <>
                            <span className="text-[var(--nova-border-strong)]">·</span>
                            <span>{selectedSpec.tags.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Summary block */}
                    <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg p-4">
                      <p className="text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1 uppercase tracking-wider font-mono">
                        Executive Summary
                      </p>
                      <p className="text-[13px] text-[var(--nova-text-primary)] leading-relaxed">
                        {selectedSpec.summary}
                      </p>
                    </div>

                    {/* Content — AI-assist visual strip */}
                    <div className="border-l-2 border-[var(--nova-ai)] pl-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-[var(--nova-ai)]" />
                        <span className="font-mono text-[10px] text-[var(--nova-ai)] uppercase tracking-widest">
                          Spec Content
                        </span>
                      </div>
                      <div className="bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-lg p-4 font-mono text-[11px] text-[var(--nova-text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {selectedSpec.content}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 rounded-xl bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center">
                <FileCode2 className="w-5 h-5 text-[var(--nova-accent)]" />
              </div>
              <p className="font-mono text-[11px] text-[var(--nova-text-muted)]">
                Select a specification from the list
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Spec Modal ── */}
      {isNewSpecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--nova-overlay)]">
          <div className="fixed inset-0" onClick={() => setIsNewSpecModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-xl z-10">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--nova-border)]">
              <span className="text-[13px] font-semibold text-[var(--nova-text-primary)]">
                Draft Architecture Specification
              </span>
              <button
                onClick={() => setIsNewSpecModalOpen(false)}
                className="p-1 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] rounded transition-colors duration-150 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSpec} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine via Raft"
                  className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[var(--nova-text-primary)] text-[12px] outline-none transition-colors duration-150"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Summary
                </label>
                <textarea
                  rows={2}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="High-level architecture intent and SLA…"
                  className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[var(--nova-text-primary)] text-[12px] outline-none transition-colors duration-150 resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--nova-text-secondary)] mb-1.5">
                  Detailed Spec Content
                </label>
                <textarea
                  rows={7}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Technical design, protocol primitives, verification criteria…"
                  className="w-full px-3 py-2 bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[var(--nova-text-primary)] font-mono text-[11px] outline-none transition-colors duration-150 resize-none"
                />
              </div>

              {/* Footer actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--nova-border-muted)]">
                <button
                  type="button"
                  onClick={() => setIsNewSpecModalOpen(false)}
                  className="text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded px-3 py-1.5 text-[12px] transition-colors duration-150 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Generated Code Modal ── */}
      {generatedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--nova-overlay)]">
          <div className="fixed inset-0" onClick={() => setGeneratedCode(null)} />
          <div className="relative w-full max-w-2xl bg-[var(--nova-surface)] border border-[var(--nova-border-strong)] rounded-xl shadow-xl overflow-hidden z-10">
            {/* Code modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--nova-border)] bg-[var(--nova-surface)]">
              <div className="flex items-center gap-2">
                {/* AI violet accent */}
                <div className="w-1.5 h-4 bg-[var(--nova-ai)] rounded-full" />
                <Code2 className="w-4 h-4 text-[var(--nova-ai)]" />
                <span className="text-[13px] font-semibold text-[var(--nova-text-primary)]">
                  AI Generated Implementation
                </span>
                <span className="font-mono text-[10px] text-[var(--nova-accent-text)] bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] px-1.5 py-0.5 rounded">
                  {selectedSpec?.key}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--nova-surface)] hover:bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] rounded text-[11px] font-mono transition-colors duration-150 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={() => setGeneratedCode(null)}
                  className="p-1.5 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] rounded transition-colors duration-150 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Code block */}
            <div className="p-4 overflow-y-auto max-h-[60vh] nova-scroll">
              <pre className="p-4 bg-[var(--nova-bg)] border border-[var(--nova-border)] rounded-lg font-mono text-[11px] text-[var(--nova-success-text)] overflow-x-auto whitespace-pre leading-relaxed">
                {generatedCode}
              </pre>
            </div>

            {/* Code modal footer */}
            <div className="px-5 py-3 border-t border-[var(--nova-border)] bg-[var(--nova-surface)] flex items-center justify-between">
              <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">
                TypeScript · Grounded in {selectedSpec?.key}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSandboxOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--nova-success-subtle)] hover:bg-[rgba(16,185,129,0.18)] border border-[var(--nova-success-border)] text-[var(--nova-success-text)] rounded text-[12px] font-medium transition-colors duration-150 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run in Sandbox
                </button>
                <button
                  onClick={() => setGeneratedCode(null)}
                  className="px-3 py-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded text-[12px] transition-colors duration-150 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Code Execution Sandbox Modal ── */}
      <CodeSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        initialCode={
          generatedCode ||
          `// In-browser Sandbox Harness for ${selectedSpec?.key || "SPEC"}
export class DistributedStateSyncEngine {
  private stateVersion = 1;

  public async syncState(payload: Record<string, unknown>) {
    console.log("[SyncEngine] Synchronizing CRDT state via Express + MongoDB engine...", payload);
    this.stateVersion += 1;
    return { status: "OK", version: this.stateVersion };
  }
}`
        }
        title={`Live Sandbox — ${selectedSpec?.key || "Spec Implementation"}`}
        language="typescript"
      />
    </div>
  );
}
