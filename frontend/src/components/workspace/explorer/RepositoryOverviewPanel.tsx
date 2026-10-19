"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Package,
  FileCode,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FolderTree,
  Box,
  Cpu,
} from "lucide-react";
import { apiFetchInit } from "@/lib/apiHeaders";

export interface IOverviewData {
  repository: {
    id: string;
    fullName: string;
    owner: string;
    name: string;
    private: boolean;
    defaultBranch: string;
    selectedBranch: string;
  };
  branch: string;
  projectDetection: {
    projectType: string;
    confidence: number;
    evidence: string[];
    framework?: string;
    runtime?: string;
  };
  packageManager: {
    name: string;
    lockfile?: string;
  };
  dependencySummary: {
    manifestFound: string[];
    topDependencies: string[];
    devDependencies?: string[];
    totalDependenciesCount: number;
  };
  rootFiles: Array<{
    name: string;
    path: string;
    size?: number;
    category: "documentation" | "configuration" | "container" | "ci_cd" | "manifest" | "source";
  }>;
  rootDirectories: string[];
  generatedAt: string;
}

interface RepositoryOverviewPanelProps {
  repositoryId: string;
  branch: string;
}

export const RepositoryOverviewPanel: React.FC<RepositoryOverviewPanelProps> = ({
  repositoryId,
  branch,
}) => {
  const [overview, setOverview] = useState<IOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, [repositoryId, branch]);

  const fetchOverview = async () => {
    if (!repositoryId) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repositoryId)}/overview?branch=${encodeURIComponent(branch)}`,
        apiFetchInit()
      );
      const data = await res.json();
      if (data.success && data.overview) {
        setOverview(data.overview);
      } else {
        setError(data.error || "Unable to generate repository overview.");
      }
    } catch (err: any) {
      setError(err.message || "Network error loading overview.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="p-3 bg-[var(--nova-deep)] border-b border-[var(--nova-border)] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold font-mono text-[var(--nova-text-primary)]">
          <Layers className="w-4 h-4 text-[var(--nova-accent)]" />
          <span>Repository Context & Metadata</span>
        </div>

        <button
          type="button"
          onClick={fetchOverview}
          disabled={isLoading}
          title="Refresh repository context"
          className="p-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--nova-accent)]" : ""}`} />
        </button>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--nova-text-muted)]">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
            <span>Analyzing repository architecture...</span>
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs text-[var(--nova-text-secondary)]">{error}</p>
          </div>
        ) : !overview ? (
          <div className="py-12 text-center text-xs text-[var(--nova-text-muted)]">
            Repository context unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tech Stack Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Project Type Card */}
              <div className="p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--nova-text-secondary)] font-mono">
                  <Cpu className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                  <span>Detected Project Type</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--nova-text-primary)]">
                    {overview.projectDetection.projectType}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {(overview.projectDetection.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>

                {/* Evidence Chips */}
                {overview.projectDetection.evidence.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {overview.projectDetection.evidence.map((ev, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]"
                      >
                        ✓ {ev}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Package Manager Card */}
              <div className="p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--nova-text-secondary)] font-mono">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Package Manager</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--nova-text-primary)] uppercase">
                    {overview.packageManager.name}
                  </span>
                  {overview.packageManager.lockfile && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-muted)]">
                      {overview.packageManager.lockfile}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--nova-text-muted)]">
                  Derived from lockfile detection in repository root.
                </p>
              </div>
            </div>

            {/* Dependency Metadata Card */}
            {overview.dependencySummary.totalDependenciesCount > 0 && (
              <div className="p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nova-text-primary)] font-mono">
                    <Box className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                    <span>Key Dependencies ({overview.dependencySummary.totalDependenciesCount})</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--nova-text-muted)]">
                    via {overview.dependencySummary.manifestFound.join(", ")}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {overview.dependencySummary.topDependencies.map((dep, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)]"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Root Structure Card */}
            <div className="p-3.5 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--nova-text-primary)] font-mono">
                <FolderTree className="w-3.5 h-3.5 text-[var(--nova-accent)]" />
                <span>Root Directories</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {overview.rootDirectories.map((dir, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]"
                  >
                    📁 {dir}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
