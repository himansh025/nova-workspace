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
  Play
} from "lucide-react";
import { Spec, SpecStatus } from "@/types";
import { CodeSandboxModal } from "@/components/workspace/CodeSandboxModal";
import { SpecsSkeleton } from "@/components/workspace/Skeletons";

export default function SpecsPage() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<Spec | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
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
        body: JSON.stringify({ status })
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
        body: JSON.stringify({ title: editTitle, content: editContent })
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
          tags: ["Architecture", "Plan"]
        })
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
        body: JSON.stringify({ specId: selectedSpec.id, language: "typescript" })
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

  const filteredSpecs = specs.filter(
    (s) => filterStatus === "all" || s.status === filterStatus
  );

  if (loading) {
    return <SpecsSkeleton />;
  }

  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200">
      {/* Top Bar */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">Architecture Specifications</h1>
            <span className="text-xs font-mono text-[var(--color-accent)] bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 px-2 py-0.5 rounded">
              PLAN ENGINE ACTIVE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Link requirements to pull requests, vector clocks, and schema migrations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter Tabs */}
          <div className="flex bg-[#161820] border border-white/10 rounded-md p-0.5 text-xs">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1 rounded ${
                filterStatus === "all" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({specs.length})
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-2.5 py-1 rounded ${
                filterStatus === "approved" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus("review")}
              className={`px-2.5 py-1 rounded ${
                filterStatus === "review" ? "bg-[var(--color-accent)] text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              In Review
            </button>
          </div>

          <button
            onClick={() => setIsNewSpecModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Spec</span>
          </button>
        </div>
      </div>

      {/* Main Two-Pane Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Specs List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-white/10 bg-[#12141A] flex flex-col shrink-0 overflow-y-auto no-scrollbar divide-y divide-white/5">
          {filteredSpecs.map((spec) => {
            const isSelected = selectedSpec?.id === spec.id;
            return (
              <div
                key={spec.id}
                onClick={() => handleSelectSpec(spec)}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#181B24] border-l-2 border-[var(--color-accent)]"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-medium text-[var(--color-accent)]">
                    {spec.key}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      spec.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : spec.status === "review"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-white/5 text-neutral-400"
                    }`}
                  >
                    {spec.status}
                  </span>
                </div>
                <h3 className="text-xs font-medium text-white line-clamp-1 mb-1">
                  {spec.title}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                  {spec.summary}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span>Author: {spec.author.name}</span>
                  <span>{spec.tags.join(", ")}</span>
                </div>
              </div>
            );
          })}

          {filteredSpecs.length === 0 && (
            <div className="p-8 text-center text-xs text-neutral-500 font-mono">
              No specifications found for selected filter.
            </div>
          )}
        </div>

        {/* Right Pane: Spec Document Reader & Editor */}
        <div className="hidden md:flex flex-1 flex-col bg-[#14161D] overflow-hidden">
          {selectedSpec ? (
            <div className="flex flex-col h-full">
              {/* Document Header & Actions */}
              <div className="px-6 py-4 border-b border-white/10 bg-[#161822] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-[var(--color-accent)] font-bold">
                    {selectedSpec.key}
                  </span>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                      selectedSpec.status === "approved"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {selectedSpec.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Status Progression Controls */}
                  {selectedSpec.status !== "approved" && (
                    <button
                      onClick={() => handleUpdateStatus("approved")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Spec</span>
                    </button>
                  )}
                  {selectedSpec.status === "drafting" && (
                    <button
                      onClick={() => handleUpdateStatus("review")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition-colors"
                    >
                      <span>Submit for Review</span>
                    </button>
                  )}

                  {/* Generate AI Code Button */}
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-accent)]/20 hover:bg-[var(--color-accent)]/30 border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingCode ? "Generating..." : "Generate AI Code"}</span>
                  </button>

                  {/* Live Sandbox Button */}
                  <button
                    onClick={() => {
                      if (!generatedCode) {
                        handleGenerateCode().then(() => setIsSandboxOpen(true));
                      } else {
                        setIsSandboxOpen(true);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-medium transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Live Sandbox</span>
                  </button>

                  {/* Toggle Edit */}
                  {isEditing ? (
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Spec</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 text-xs font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteSpec(selectedSpec.id)}
                    className="p-1.5 rounded hover:bg-white/5 text-neutral-500 hover:text-rose-400"
                    title="Delete Specification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Document Body */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 no-scrollbar">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-neutral-400 text-xs font-medium mb-1">
                        Specification Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white text-sm focus:outline-hidden focus:border-[var(--color-accent)]"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 text-xs font-medium mb-1">
                        Specification Content (Markdown)
                      </label>
                      <textarea
                        rows={16}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white font-mono text-xs focus:outline-hidden focus:border-[var(--color-accent)] resize-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl space-y-6">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {selectedSpec.title}
                      </h1>
                      <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 mt-2">
                        <span>Lead: {selectedSpec.author.name}</span>
                        <span>•</span>
                        <span>Created: {new Date(selectedSpec.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-emerald-400">Board Consensus Met</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#1B1E28] border border-white/5 text-xs text-neutral-300 leading-relaxed font-sans">
                      <span className="font-semibold text-white block mb-1">Executive Summary:</span>
                      {selectedSpec.summary}
                    </div>

                    {/* Formatted Markdown Content */}
                    <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300 space-y-4 whitespace-pre-wrap font-mono bg-black/20 p-5 rounded-lg border border-white/5">
                      {selectedSpec.content}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500 text-xs font-mono">
              Select a specification from the directory
            </div>
          )}
        </div>
      </div>

      {/* New Spec Modal */}
      {isNewSpecModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setIsNewSpecModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#14161D] border border-white/15 rounded-xl shadow-2xl p-5 z-10 text-xs text-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-sm font-semibold text-white">
                Draft Architecture Specification
              </span>
              <button
                onClick={() => setIsNewSpecModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSpec} className="space-y-4">
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine via Raft"
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)]"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Summary</label>
                <textarea
                  rows={2}
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="High-level architecture intent and SLA..."
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white focus:outline-hidden focus:border-[var(--color-accent)] resize-none"
                />
              </div>
              <div>
                <label className="block text-neutral-400 text-[11px] mb-1">Detailed Spec Content</label>
                <textarea
                  rows={6}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Technical design, protocol primitives, verification criteria..."
                  className="w-full px-3 py-2 rounded-md bg-[#1B1E28] border border-white/10 text-white font-mono text-[11px] focus:outline-hidden focus:border-[var(--color-accent)] resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewSpecModalOpen(false)}
                  className="px-3 py-1.5 rounded text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium"
                >
                  Create Spec
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Code Modal */}
      {generatedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="fixed inset-0" onClick={() => setGeneratedCode(null)} />
          <div className="relative w-full max-w-2xl bg-[#14161D] border border-white/15 rounded-xl shadow-2xl overflow-hidden z-10 text-xs text-neutral-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#171922]">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[var(--color-accent)]" />
                <span className="font-semibold text-sm text-white">
                  AI Generated Implementation — {selectedSpec?.key}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-[11px] font-mono transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
                <button
                  onClick={() => setGeneratedCode(null)}
                  className="p-1 text-neutral-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto max-h-[70vh] no-scrollbar">
              <pre className="p-4 rounded-lg bg-[#0B0C0E] border border-white/10 font-mono text-xs text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {generatedCode}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-white/10 bg-[#0E1015] flex justify-between items-center text-[10px] font-mono text-neutral-400">
              <span>TypeScript Engine Delegate • Grounded in {selectedSpec?.key}</span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => setIsSandboxOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-600/30 transition-all"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run in Sandbox</span>
                </button>
                <button
                  onClick={() => setGeneratedCode(null)}
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 text-white text-xs"
                >
                  Close Code Reader
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Code Execution Sandbox Modal */}
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
