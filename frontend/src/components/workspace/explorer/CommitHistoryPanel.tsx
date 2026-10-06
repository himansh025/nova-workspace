"use client";

import React, { useState, useEffect } from "react";
import {
  GitCommit,
  User,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileCode,
  Plus,
  Minus,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { apiFetchInit } from "@/lib/apiHeaders";

export interface ICommitItem {
  sha: string;
  shortSha: string;
  message: string;
  author: {
    name: string;
    email?: string;
    avatarUrl?: string;
    date: string;
  };
  htmlUrl: string;
  parents: string[];
}

export interface ICommitDetail extends ICommitItem {
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patchSummary?: string;
  }>;
}

interface CommitHistoryPanelProps {
  repositoryId: string;
  branch: string;
}

export const CommitHistoryPanel: React.FC<CommitHistoryPanelProps> = ({
  repositoryId,
  branch,
}) => {
  const [commits, setCommits] = useState<ICommitItem[]>([]);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [commitDetail, setCommitDetail] = useState<ICommitDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCommits();
    setSelectedCommitSha(null);
    setCommitDetail(null);
  }, [repositoryId, branch]);

  const fetchCommits = async () => {
    if (!repositoryId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repositoryId)}/commits?branch=${encodeURIComponent(branch)}&perPage=30`,
        apiFetchInit()
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.commits)) {
        setCommits(data.commits);
      } else {
        setError(data.error || "Unable to load commits.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading commits.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCommit = async (sha: string) => {
    setSelectedCommitSha(sha);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repositoryId)}/commits/${encodeURIComponent(sha)}`,
        apiFetchInit()
      );
      const data = await res.json();
      if (data.success && data.commit) {
        setCommitDetail(data.commit);
      }
    } catch (err) {
      console.error("Failed to load commit details:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="p-3 bg-[var(--nova-deep)] border-b border-[var(--nova-border)] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-mono">
          {selectedCommitSha ? (
            <button
              type="button"
              onClick={() => {
                setSelectedCommitSha(null);
                setCommitDetail(null);
              }}
              className="flex items-center gap-1 text-[var(--nova-accent)] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to commits</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-[var(--nova-text-primary)]">
              <GitCommit className="w-4 h-4 text-[var(--nova-accent)]" />
              <span>Recent Commits ({branch})</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={fetchCommits}
          disabled={isLoading}
          title="Refresh commit history"
          className="p-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--nova-accent)]" : ""}`} />
        </button>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--nova-text-muted)]">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
            <span>Loading commits...</span>
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs text-[var(--nova-text-secondary)]">{error}</p>
          </div>
        ) : selectedCommitSha ? (
          /* Single Commit Detail View */
          isLoadingDetail ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--nova-text-muted)]">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
              <span>Loading commit metadata...</span>
            </div>
          ) : commitDetail ? (
            <div className="space-y-4 p-2">
              {/* Commit Summary Card */}
              <div className="p-4 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-semibold text-[var(--nova-text-primary)] leading-snug">
                      {commitDetail.message}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--nova-text-secondary)]">
                      <User className="w-3 h-3 text-[var(--nova-text-muted)]" />
                      <span>{commitDetail.author.name}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3 text-[var(--nova-text-muted)]" />
                      <span>{formatDate(commitDetail.author.date)}</span>
                    </div>
                  </div>

                  <a
                    href={commitDetail.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Diff Stats */}
                <div className="flex items-center gap-3 text-[11px] font-mono pt-2 border-t border-[var(--nova-border)]">
                  <span className="text-[var(--nova-text-muted)]">SHA: {commitDetail.shortSha}</span>
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Plus className="w-3 h-3" />
                    {commitDetail.stats.additions}
                  </span>
                  <span className="flex items-center gap-0.5 text-rose-500">
                    <Minus className="w-3 h-3" />
                    {commitDetail.stats.deletions}
                  </span>
                  <span className="text-[var(--nova-text-muted)]">
                    {commitDetail.files.length} {commitDetail.files.length === 1 ? "file" : "files"} changed
                  </span>
                </div>
              </div>

              {/* Changed Files List */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-semibold text-[var(--nova-text-secondary)] uppercase tracking-wider font-mono">
                  Changed Files
                </h5>
                {commitDetail.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0" />
                      <span className="truncate text-[var(--nova-text-primary)]">{file.filename}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[10px]">
                      <span className="text-emerald-600 font-semibold">+{file.additions}</span>
                      <span className="text-rose-500 font-semibold">-{file.deletions}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[var(--nova-surface)] text-[var(--nova-text-muted)] border border-[var(--nova-border)] uppercase">
                        {file.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[var(--nova-text-muted)]">
              Commit details unavailable.
            </div>
          )
        ) : commits.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--nova-text-muted)]">
            No commits found on branch {branch}.
          </div>
        ) : (
          /* Commits List */
          <div className="space-y-1.5">
            {commits.map((c) => (
              <button
                key={c.sha}
                type="button"
                onClick={() => handleSelectCommit(c.sha)}
                className="w-full p-2.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] hover:border-[var(--nova-accent)] text-left transition-all space-y-1.5 group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-[var(--nova-text-primary)] truncate group-hover:text-[var(--nova-accent)] transition-colors">
                    {c.message}
                  </span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-muted)] shrink-0">
                    {c.shortSha}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-[var(--nova-text-secondary)] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    {c.author.avatarUrl ? (
                      <img
                        src={c.author.avatarUrl}
                        alt={c.author.name}
                        className="w-3.5 h-3.5 rounded-full"
                      />
                    ) : (
                      <User className="w-3 h-3 text-[var(--nova-text-muted)]" />
                    )}
                    <span className="truncate">{c.author.name}</span>
                  </div>

                  <span className="text-[var(--nova-text-muted)] shrink-0">
                    {formatDate(c.author.date)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
