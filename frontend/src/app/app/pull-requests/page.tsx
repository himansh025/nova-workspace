"use client";

import React, { useState, useEffect } from "react";
import {
  GitPullRequest,
  GitCommit,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCode,
  Check,
  Clock,
  Layers,
} from "lucide-react";
import { PullRequest } from "@/types";
import { useToast } from "@/components/workspace/ToastProvider";

export default function PullRequestsPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "merged">("open");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const { addToast } = useToast();

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/pull-requests");
      const data = await res.json();
      if (data.pullRequests) {
        setPullRequests(data.pullRequests);
        if (!selectedPR && data.pullRequests.length > 0) {
          setSelectedPR(data.pullRequests[0]);
        } else if (selectedPR) {
          const updated = data.pullRequests.find((p: PullRequest) => p.id === selectedPR.id);
          if (updated) setSelectedPR(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pull requests", err);
    }
  };

  useEffect(() => {
    fetchPRs();
    window.addEventListener("nova:realtime_sync", fetchPRs);
    return () => window.removeEventListener("nova:realtime_sync", fetchPRs);
  }, []);

  const handleRunAIReview = async () => {
    if (!selectedPR) return;
    setIsReviewing(true);
    try {
      const res = await fetch("/api/ai/review-pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prId: selectedPR.id }),
      });
      const data = await res.json();
      if (data.review && data.pullRequest) {
        setSelectedPR(data.pullRequest);
        setPullRequests((prev) =>
          prev.map((p) => (p.id === data.pullRequest.id ? data.pullRequest : p))
        );
        addToast({
          title: `AI Review Complete (PR #${selectedPR.number})`,
          message: `Quality Score: ${data.review.score}/100 • Security: ${data.review.securityStatus}`,
          type: "accent",
        });
      }
    } catch (err) {
      console.error("Failed to run AI review", err);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleMergePR = async () => {
    if (!selectedPR || selectedPR.status === "merged") return;
    setIsMerging(true);
    try {
      const res = await fetch("/api/pull-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedPR.id, action: "merge" }),
      });
      const data = await res.json();
      if (data.pullRequest) {
        setSelectedPR(data.pullRequest);
        setPullRequests((prev) =>
          prev.map((p) => (p.id === data.pullRequest.id ? data.pullRequest : p))
        );
        addToast({
          title: `PR #${selectedPR.number} Merged`,
          message: `Merged into ${selectedPR.targetBranch}. Linked issue marked Done.`,
          type: "commit",
        });
      }
    } catch (err) {
      console.error("Failed to merge PR", err);
    } finally {
      setIsMerging(false);
    }
  };

  const filtered = pullRequests.filter((pr) => {
    if (filter === "all") return true;
    return pr.status === filter;
  });

  return (
    <div className="flex flex-col h-full bg-[#111216] text-neutral-200">
      {/* Top Header */}
      <div className="p-4 sm:px-6 border-b border-white/10 bg-[#0E1015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-white">Pull Requests & AI Review</h1>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 rounded flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI AUDIT ENGINE
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Continuous static analysis, cryptographic validation checks, and unified git diff review
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-[#161820] border border-white/10 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "all" ? "bg-white/10 text-white font-medium" : "text-neutral-400 hover:text-white"
            }`}
          >
            All ({pullRequests.length})
          </button>
          <button
            onClick={() => setFilter("open")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "open" ? "bg-indigo-600 text-white font-medium shadow-sm" : "text-neutral-400 hover:text-white"
            }`}
          >
            Open ({pullRequests.filter((p) => p.status === "open").length})
          </button>
          <button
            onClick={() => setFilter("merged")}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === "merged" ? "bg-purple-600 text-white font-medium shadow-sm" : "text-neutral-400 hover:text-white"
            }`}
          >
            Merged ({pullRequests.filter((p) => p.status === "merged").length})
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        {/* Left: PR Directory List */}
        <div className="w-full lg:w-96 flex flex-col shrink-0 bg-[#0B0C0E] overflow-y-auto no-scrollbar">
          <div className="p-3 border-b border-white/5 bg-black/20 text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
            Active Pull Requests ({filtered.length})
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((pr) => {
              const isSelected = selectedPR?.id === pr.id;
              return (
                <div
                  key={pr.id}
                  onClick={() => setSelectedPR(pr)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? "bg-white/[0.06] border-l-2 border-indigo-500" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <GitPullRequest
                        className={`w-4 h-4 ${
                          pr.status === "merged"
                            ? "text-purple-400"
                            : "text-emerald-400"
                        }`}
                      />
                      <span className="text-xs font-semibold text-white">#{pr.number}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                          pr.status === "merged"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                    {pr.linkedIssueKey && (
                      <span className="text-[10px] font-mono text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded">
                        {pr.linkedIssueKey}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-medium text-neutral-200 line-clamp-2 mb-2">
                    {pr.title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded-full bg-indigo-600/50 flex items-center justify-center text-[9px] text-white">
                        {pr.author.initials}
                      </div>
                      <span>{pr.author.name.split(" ")[0]}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">+{pr.additions}</span>
                      <span className="text-rose-400">-{pr.deletions}</span>
                      {pr.aiReview && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {pr.aiReview.score}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: PR Inspection & Diff Viewer */}
        {selectedPR ? (
          <div className="flex-1 flex flex-col min-h-0 bg-[#0A0B0D] overflow-y-auto">
            {/* PR Header & Controls */}
            <div className="p-6 border-b border-white/10 bg-[#0E1015]">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                    <span className="font-mono text-white font-semibold">PR #{selectedPR.number}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono text-neutral-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      <GitBranch className="w-3 h-3 text-sky-400" />
                      {selectedPR.branch}
                      <ArrowRight className="w-2.5 h-2.5 text-neutral-500" />
                      {selectedPR.targetBranch}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedPR.createdAt}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-white">{selectedPR.title}</h2>
                  <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                    {selectedPR.description}
                  </p>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRunAIReview}
                    disabled={isReviewing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-medium transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>{isReviewing ? "Analyzing Diff..." : "Run AI Review"}</span>
                  </button>

                  <button
                    onClick={handleMergePR}
                    disabled={isMerging || selectedPR.status === "merged"}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-md ${
                      selectedPR.status === "merged"
                        ? "bg-purple-700/50 text-neutral-400 cursor-not-allowed border border-purple-500/20"
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                    }`}
                  >
                    {selectedPR.status === "merged" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Merged</span>
                      </>
                    ) : (
                      <>
                        <GitPullRequest className="w-3.5 h-3.5" />
                        <span>{isMerging ? "Merging..." : "Merge Pull Request"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Review Diagnostics Banner */}
            {selectedPR.aiReview && (
              <div className="p-6 border-b border-white/10 bg-[#12141C]">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                        <span>Nova AI Review Report</span>
                        <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                          SCORE: {selectedPR.aiReview.score}/100
                        </span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">{selectedPR.aiReview.summary}</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[11px] font-mono text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{selectedPR.aiReview.securityStatus}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/5 text-[11px] font-mono text-amber-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{selectedPR.aiReview.performanceImpact}</span>
                    </div>
                  </div>
                </div>

                {/* Findings List */}
                {selectedPR.aiReview.findings.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedPR.aiReview.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-lg bg-black/30 border border-white/5 flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                            {f.type === "performance" ? (
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            {f.title}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            {f.filename}:{f.lineNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{f.message}</p>
                        {f.suggestion && (
                          <pre className="p-2 rounded bg-black/50 border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto mt-1">
                            {f.suggestion}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Unified Git Diff Viewer */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  Files Changed ({selectedPR.diff.length})
                </span>
                <span className="text-[11px] text-neutral-500">Unified Unified Diff Syntax</span>
              </div>

              {selectedPR.diff.map((file, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-[#0B0C0E] overflow-hidden shadow-lg"
                >
                  {/* File Header */}
                  <div className="px-4 py-2.5 bg-[#14161D] border-b border-white/10 flex items-center justify-between text-xs font-mono">
                    <span className="text-white font-medium">{file.filename}</span>
                    <span className="text-[10px] text-neutral-500">{file.newPath}</span>
                  </div>

                  {/* Diff Chunks */}
                  <div className="p-2 overflow-x-auto font-mono text-xs leading-relaxed">
                    {file.chunks.map((chunk, cIdx) => (
                      <div key={cIdx}>
                        <div className="px-3 py-1 text-[10px] text-neutral-500 bg-white/[0.02] select-none">
                          {chunk.header}
                        </div>
                        <div className="divide-y divide-white/[0.02]">
                          {chunk.lines.map((line, lIdx) => (
                            <div
                              key={lIdx}
                              className={`flex items-start px-3 py-0.5 ${
                                line.type === "add"
                                  ? "bg-emerald-500/10 text-emerald-300"
                                  : line.type === "del"
                                  ? "bg-rose-500/10 text-rose-300 line-through opacity-80"
                                  : "text-neutral-300"
                              }`}
                            >
                              <span className="w-8 select-none text-[10px] text-neutral-600 shrink-0">
                                {line.newLine || line.oldLine || ""}
                              </span>
                              <span className="w-4 select-none font-bold shrink-0">
                                {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                              </span>
                              <span className="flex-1 whitespace-pre">{line.content.replace(/^[+-]/, "")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 p-8 text-center">
            <GitPullRequest className="w-10 h-10 opacity-30 mb-2" />
            <p className="text-xs">Select a pull request on the left to inspect git diff and run AI code review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
