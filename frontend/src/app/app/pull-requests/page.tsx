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
  RefreshCw,
  Github,
  Search,
  Trash2,
} from "lucide-react";
import { PullRequest } from "@/types";
import { useToast } from "@/components/workspace/ToastProvider";
import { PullRequestsSkeleton } from "@/components/workspace/Skeletons";
import Link from "next/link";

export default function PullRequestsPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [integration, setIntegration] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "open" | "merged">("open");
  const [searchQuery, setSearchQuery] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchPRs = async () => {
    try {
      const res = await fetch("/api/pull-requests");
      const data = await res.json();
      if (data.pullRequests) {
        setPullRequests(data.pullRequests);
        setIntegration(data.integration);
        if (!selectedPR && data.pullRequests.length > 0) {
          setSelectedPR(data.pullRequests[0]);
        } else if (selectedPR) {
          const updated = data.pullRequests.find((p: PullRequest) => p.id === selectedPR.id);
          if (updated) setSelectedPR(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pull requests", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGitHub = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/pull-requests/sync", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPullRequests(data.pullRequests);
        addToast({
          title: "GitHub Synchronized",
          message: data.message,
          type: "success",
        });
      } else {
        addToast({
          title: "Sync Failed",
          message: data.message || "Failed to sync with GitHub",
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Failed to sync PRs", err);
    } finally {
      setIsSyncing(false);
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
          title: `PR #${selectedPR.number} Marked Merged (Local)`,
          message: `Local tracking updated for ${selectedPR.targetBranch}. (Autonomous GitHub merge is disabled).`,
          type: "commit",
        });
      }
    } catch (err) {
      console.error("Failed to merge PR", err);
    } finally {
      setIsMerging(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePR = async () => {
    if (!selectedPR) return;
    if (!confirm(`Are you sure you want to delete PR #${selectedPR.number}?`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pull-requests/${selectedPR.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: `PR #${selectedPR.number} Deleted`,
          message: "Pull request removed from workspace.",
          type: "commit",
        });
        const remaining = pullRequests.filter((p) => p.id !== selectedPR.id);
        setPullRequests(remaining);
        setSelectedPR(remaining.length > 0 ? remaining[0] : null);
      } else {
        addToast({
          title: "Delete Failed",
          message: data.error || "Could not delete PR",
          type: "warning",
        });
      }
    } catch (err) {
      console.error("Failed to delete PR", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = pullRequests.filter((pr) => {
    const matchesFilter = filter === "all" || pr.status === filter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(pr.number).includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return <PullRequestsSkeleton />;
  }

  const getPRStatusBadge = (status: string) => {
    if (status === "merged") {
      return "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)] border border-[var(--nova-success-border)]";
    }
    if (status === "draft") {
      return "bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border border-[var(--nova-border)]";
    }
    if (status === "closed") {
      return "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] border border-[var(--nova-danger-border)]";
    }
    return "bg-[var(--nova-info-subtle)] text-[var(--nova-info-text)] border border-[var(--nova-info-border)]";
  };

  return (
    <div className="flex flex-col h-full bg-[var(--nova-bg)]">
      {/* ── Page Header ── */}
      <div className="px-5 py-3 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] text-[var(--nova-text-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-[var(--nova-text-primary)]">
              Pull Requests
            </h1>
            {/* AI badge */}
            <span className="flex items-center gap-1 bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-1.5 py-0.5 text-[10px] font-medium font-mono uppercase tracking-widest">
              <Sparkles className="w-2.5 h-2.5" />
              AI Audit
            </span>
            {/* GitHub live indicator */}
            {integration?.configured && (
              <span className="flex items-center gap-1 bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] text-[var(--nova-success-text)] rounded px-1.5 py-0.5 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--nova-success)] animate-pulse" />
                {integration.repository}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[var(--nova-text-muted)] mt-0.5">
            Continuous static analysis, cryptographic validation checks, and unified git diff review.
          </p>
        </div>

        {/* Right side: Search + Sync + Filters (Purely Right Aligned) */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 ml-auto">
          {/* PR Search (Wider) */}
          <div className="relative flex items-center min-w-[180px] w-full sm:w-64 md:w-80">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-[var(--nova-text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search PRs by title, branch, #..."
              className="pl-8 pr-3 py-1.5 w-full bg-[var(--nova-bg)] border border-[var(--nova-border)] focus:border-[var(--nova-accent)] rounded-md text-[12px] text-[var(--nova-text-primary)] placeholder:text-[var(--nova-text-muted)] outline-none transition-colors duration-150 h-8"
            />
          </div>

          {/* GitHub Sync Button */}
          {integration?.configured && (
            <button
              onClick={handleSyncGitHub}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] rounded-md px-3 py-1.5 text-[12px] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer h-8 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-[var(--nova-success-text)]" : "text-[var(--nova-text-secondary)]"}`} />
              <span className="text-[12px]">{isSyncing ? "Syncing…" : "Sync GitHub"}</span>
            </button>
          )}

          {/* Status filter tabs (Purely Right) */}
          <div className="flex items-center bg-[var(--nova-bg)] border border-[var(--nova-border-muted)] rounded-md p-0.5 gap-0.5 h-8 shrink-0">
            {(["all", "open", "merged"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors duration-150 cursor-pointer ${
                  filter === f
                    ? "bg-[var(--nova-deep)] text-[var(--nova-text-primary)] border border-[var(--nova-border)]"
                    : "text-[var(--nova-text-muted)] hover:text-[var(--nova-text-secondary)]"
                }`}
              >
                {f === "all"
                  ? `All (${pullRequests.length})`
                  : f === "open"
                  ? `Open (${pullRequests.filter((p) => p.status === "open").length})`
                  : `Merged (${pullRequests.filter((p) => p.status === "merged").length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {pullRequests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 bg-[var(--nova-bg)]">
          <div className="w-14 h-14 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] flex items-center justify-center shadow-xs">
            <Github className="w-6 h-6 text-[var(--nova-text-muted)]" />
          </div>
          <div className="text-center">
            <h2 className="text-[15px] font-semibold text-[var(--nova-text-primary)] mb-1">No Pull Requests Found</h2>
            <p className="text-[12px] text-[var(--nova-text-secondary)] max-w-xs leading-relaxed">
              Connect your GitHub repository to synchronize live pull requests, run AI audits, and auto-update tasks on merge.
            </p>
          </div>
          {!integration?.configured ? (
            <Link
              href="/app/settings"
              className="bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150"
            >
              Configure GitHub Integration
            </Link>
          ) : (
            <button
              onClick={handleSyncGitHub}
              disabled={isSyncing}
              className="flex items-center gap-1.5 bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Synchronizing…" : "Sync Repository"}</span>
            </button>
          )}
        </div>
      ) : (
        /* ── Main Two-Column Layout ── */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[var(--nova-border-muted)]">

          {/* ── Left: PR List ── */}
          <div className="w-full lg:w-[340px] flex flex-col shrink-0 bg-[var(--nova-surface)] overflow-y-auto nova-scroll">
            {/* List sub-header */}
            <div className="px-4 py-2 border-b border-[var(--nova-border-muted)] bg-[var(--nova-bg)] flex items-center justify-between shrink-0">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)]">
                Pull Requests
              </span>
              <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">
                {filtered.length} shown
              </span>
            </div>

            {/* PR rows */}
            <div className="divide-y divide-[var(--nova-border-muted)]">
              {filtered.map((pr) => {
                const isSelected = selectedPR?.id === pr.id;
                return (
                  <div
                    key={pr.id}
                    onClick={() => setSelectedPR(pr)}
                    className={`px-4 py-3 cursor-pointer transition-colors duration-150 flex items-start gap-3 group border-b border-[var(--nova-border-muted)] ${
                      isSelected
                        ? "border-l-2 border-[#6366F1] bg-[rgba(99,102,241,0.08)]"
                        : "border-l-2 border-transparent hover:bg-[var(--nova-deep)]"
                    }`}
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      <GitPullRequest
                        className={`w-3.5 h-3.5 ${
                          pr.status === "merged"
                            ? "text-[var(--nova-ai)]"
                            : pr.status === "draft"
                            ? "text-[var(--nova-text-muted)]"
                            : "text-[var(--nova-success)]"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* PR number + status badge + linked issue */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--nova-accent)] font-mono text-[11px] font-semibold">
                            #{pr.number}
                          </span>
                          {/* Status badge */}
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${getPRStatusBadge(pr.status)}`}
                          >
                            {pr.status}
                          </span>
                        </div>
                        {pr.linkedIssueKey && (
                          <span className="text-[var(--nova-accent)] font-mono text-[10px] bg-[var(--nova-deep)] border border-[var(--nova-border-muted)] px-1.5 py-0.5 rounded">
                            {pr.linkedIssueKey}
                          </span>
                        )}
                      </div>

                      {/* PR title */}
                      <p className="text-[12px] font-medium text-[var(--nova-text-primary)] line-clamp-2 leading-snug mb-1.5">
                        {pr.title}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center justify-between text-[10px] text-[var(--nova-text-muted)]">
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-2.5 h-2.5" />
                          <span className="font-mono truncate max-w-[100px] text-[var(--nova-text-secondary)]">{pr.branch}</span>
                          <span className="mx-0.5">·</span>
                          <div className="w-3.5 h-3.5 rounded-full bg-[var(--nova-accent-subtle)] border border-[var(--nova-accent-border)] flex items-center justify-center text-[8px] text-[var(--nova-accent-text)] font-bold shrink-0">
                            {pr.author.initials}
                          </div>
                          <span>{pr.author.name.split(" ")[0]}</span>
                        </div>

                        {/* Diff stats + AI score */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--nova-success-text)]">+{pr.additions}</span>
                          <span className="text-[var(--nova-danger-text)]">-{pr.deletions}</span>
                          {pr.aiReview && (
                            <span className="bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-1 py-0.5 text-[10px] font-mono">
                              {pr.aiReview.score}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: PR Detail / Diff Viewer ── */}
          {selectedPR ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto nova-scroll bg-[var(--nova-bg)] border-l border-[var(--nova-border)]">

              {/* Detail Header */}
              <div className="px-5 py-4 border-b border-[var(--nova-border)] bg-[var(--nova-surface)] shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    {/* PR meta row */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--nova-text-muted)] mb-1.5">
                      <span className="text-[var(--nova-accent)] font-mono font-semibold">PR #{selectedPR.number}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono bg-[var(--nova-deep)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] rounded px-1.5 py-0.5">
                        <GitBranch className="w-2.5 h-2.5 text-[var(--nova-info)]" />
                        {selectedPR.branch}
                        <ArrowRight className="w-2 h-2 text-[var(--nova-text-muted)]" />
                        {selectedPR.targetBranch}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {selectedPR.createdAt}
                      </span>
                    </div>
                    <h2 className="text-[14px] font-semibold text-[var(--nova-text-primary)] leading-snug">
                      {selectedPR.title}
                    </h2>
                    {selectedPR.description && (
                      <p className="text-[12px] text-[var(--nova-text-secondary)] mt-1 leading-relaxed max-w-2xl">
                        {selectedPR.description}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* AI Review */}
                    <button
                      onClick={handleRunAIReview}
                      disabled={isReviewing}
                      className="flex items-center gap-1.5 bg-[var(--nova-ai-subtle)] hover:bg-[rgba(139,92,246,0.18)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{isReviewing ? "Analyzing…" : "AI Review"}</span>
                    </button>

                    {/* Merge (Local status tracking) */}
                    <button
                      onClick={handleMergePR}
                      disabled={isMerging || selectedPR.status === "merged"}
                      title="Updates local Nova tracking status. Does not push merge to GitHub."
                      className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 cursor-pointer ${
                        selectedPR.status === "merged"
                          ? "bg-[var(--nova-ai-subtle)] border border-[var(--nova-ai-border)] text-[var(--nova-ai-text)] cursor-not-allowed opacity-60"
                          : "bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white disabled:opacity-50"
                      }`}
                    >
                      {selectedPR.status === "merged" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Merged (Local)</span>
                        </>
                      ) : (
                        <>
                          <GitPullRequest className="w-3 h-3" />
                          <span>{isMerging ? "Updating…" : "Mark Merged (Local)"}</span>
                        </>
                      )}
                    </button>

                    {/* Delete PR */}
                    <button
                      onClick={handleDeletePR}
                      disabled={isDeleting}
                      title="Delete Pull Request from workspace"
                      className="flex items-center gap-1.5 border border-[var(--nova-danger-border)] bg-[var(--nova-danger-subtle)] hover:bg-[rgba(239,68,68,0.2)] text-[var(--nova-danger-text)] rounded px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-150 disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">{isDeleting ? "Deleting…" : "Delete"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── AI Review Diagnostics Banner ── */}
              {selectedPR.aiReview && (
                <div className="mx-5 mt-4 bg-[var(--nova-surface)] border border-[var(--nova-ai-border)] rounded-lg overflow-hidden shadow-xs">
                  {/* Banner header — violet left accent */}
                  <div className="px-4 py-3 border-b border-[var(--nova-border-muted)] border-l-2 border-l-[var(--nova-ai)] flex items-center justify-between gap-4 bg-[var(--nova-ai-subtle)]">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--nova-ai)]" />
                      <span className="text-[13px] font-medium text-[var(--nova-text-primary)]">Nova AI Review Report</span>
                      <span className="bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] text-[var(--nova-success-text)] rounded px-1.5 py-0.5 text-[10px] font-mono">
                        Score {selectedPR.aiReview.score}/100
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--nova-success-text)] bg-[var(--nova-success-subtle)] border border-[var(--nova-success-border)] rounded px-2 py-0.5">
                        <ShieldCheck className="w-3 h-3" />
                        {selectedPR.aiReview.securityStatus}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--nova-warning-text)] bg-[var(--nova-warning-subtle)] border border-[var(--nova-warning-border)] rounded px-2 py-0.5">
                        <Zap className="w-3 h-3" />
                        {selectedPR.aiReview.performanceImpact}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="px-4 py-2.5">
                    <p className="text-[12px] text-[var(--nova-text-secondary)] leading-relaxed">{selectedPR.aiReview.summary}</p>
                  </div>

                  {/* Findings */}
                  {selectedPR.aiReview.findings.length > 0 && (
                    <div className="px-4 pb-4 space-y-2">
                      {selectedPR.aiReview.findings.map((f) => (
                        <div
                          key={f.id}
                          className="bg-[var(--nova-elevated)] border border-[var(--nova-border)] rounded-lg p-3 shadow-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-medium text-[var(--nova-text-primary)] flex items-center gap-1.5">
                              {f.type === "performance" ? (
                                <Zap className="w-3 h-3 text-[var(--nova-warning-text)]" />
                              ) : (
                                <ShieldCheck className="w-3 h-3 text-[var(--nova-success-text)]" />
                              )}
                              {f.title}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">
                              {f.filename}:{f.lineNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--nova-text-secondary)] leading-relaxed">{f.message}</p>
                          {f.suggestion && (
                            <pre className="mt-2 px-3 py-2 rounded bg-[var(--nova-bg)] border border-[var(--nova-border)] font-mono text-[10px] text-[var(--nova-success-text)] overflow-x-auto">
                              {f.suggestion}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Unified Git Diff Viewer ── */}
              <div className="p-5 space-y-4">
                {/* Section label */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--nova-text-muted)]">
                    <FileCode className="w-3 h-3" />
                    Files Changed ({selectedPR.diff.length})
                  </span>
                  <span className="text-[11px] text-[var(--nova-text-muted)]">Unified diff syntax</span>
                </div>

                {selectedPR.diff.map((file, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--nova-surface)] border border-[var(--nova-border)] shadow-xs rounded-lg overflow-hidden"
                  >
                    {/* File header */}
                    <div className="px-4 py-2 bg-[var(--nova-elevated)] border-b border-[var(--nova-border)] flex items-center justify-between">
                      <span className="font-mono text-[12px] font-medium text-[var(--nova-text-primary)]">
                        {file.filename}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--nova-text-muted)]">{file.newPath}</span>
                    </div>

                    {/* Diff chunks */}
                    <div className="overflow-x-auto font-mono text-[12px] leading-relaxed">
                      {file.chunks.map((chunk, cIdx) => (
                        <div key={cIdx}>
                          {/* Chunk header */}
                          <div className="px-4 py-1 text-[10px] text-[var(--nova-text-muted)] bg-[var(--nova-deep)] select-none">
                            {chunk.header}
                          </div>
                          {/* Lines */}
                          <div>
                            {chunk.lines.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className={`flex items-start px-4 py-px ${
                                  line.type === "add"
                                    ? "bg-[var(--nova-success-subtle)] text-[var(--nova-success-text)]"
                                    : line.type === "del"
                                    ? "bg-[var(--nova-danger-subtle)] text-[var(--nova-danger-text)] line-through opacity-75"
                                    : "text-[var(--nova-text-secondary)]"
                                }`}
                              >
                                {/* Line number */}
                                <span className="w-7 shrink-0 select-none text-[10px] text-[var(--nova-text-muted)]">
                                  {line.newLine || line.oldLine || ""}
                                </span>
                                {/* Sigil */}
                                <span className="w-4 shrink-0 font-bold select-none">
                                  {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
                                </span>
                                {/* Content */}
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
            /* ── No PR selected ── */
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[var(--nova-text-muted)] p-8 text-center bg-[var(--nova-bg)]">
              <GitPullRequest className="w-8 h-8 opacity-20" />
              <p className="text-[12px]">
                Select a pull request to inspect the git diff and run AI code review.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
