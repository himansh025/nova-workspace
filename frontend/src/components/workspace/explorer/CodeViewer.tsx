"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  FileCode,
  FileText,
  AlertTriangle,
  FileQuestion,
  WrapText,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/workspace/ToastProvider";

export interface IFileViewData {
  type: "file" | "file_too_large" | "binary";
  path: string;
  name: string;
  size: number;
  sha?: string;
  content?: string | null;
  language?: string;
  encoding?: string;
  maxSize?: number;
  mimeType?: string;
}

interface CodeViewerProps {
  file: IFileViewData | null;
  branch: string;
  repositoryFullName?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  file,
  branch,
  repositoryFullName,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleCopy = async () => {
    if (!file?.content) return;
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      addToast({
        title: "Copied to Clipboard",
        message: `${file.name} source code copied.`,
        type: "accent",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({
        title: "Copy Failed",
        message: "Unable to copy text to clipboard.",
        type: "warning",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl text-[var(--nova-text-muted)] space-y-3">
        <div className="w-6 h-6 border-2 border-[var(--nova-accent)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading source file...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl text-[var(--nova-text-primary)] space-y-4">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1 max-w-md">
          <h4 className="text-sm font-semibold">Unable to Load File</h4>
          <p className="text-xs text-[var(--nova-text-secondary)]">{error}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-md bg-[var(--nova-deep)] hover:bg-[var(--nova-surface)] border border-[var(--nova-border)] text-xs font-medium transition-colors cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!file) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl text-[var(--nova-text-muted)] space-y-3">
        <div className="p-3 rounded-full bg-[var(--nova-deep)] text-[var(--nova-text-muted)]">
          <FileText className="w-6 h-6" />
        </div>
        <div className="text-center space-y-1">
          <h4 className="text-xs font-semibold text-[var(--nova-text-secondary)]">No File Selected</h4>
          <p className="text-[11px] text-[var(--nova-text-muted)] max-w-xs">
            Select a file from the repository tree on the left to inspect its contents.
          </p>
        </div>
      </div>
    );
  }

  const lines = (file.content || "").split("\n");
  const githubUrl =
    repositoryFullName && file.path
      ? `https://github.com/${repositoryFullName}/blob/${encodeURIComponent(branch)}/${encodeURIComponent(file.path).replace(/%2F/g, "/")}`
      : undefined;

  return (
    <div className="flex flex-col h-full bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[var(--nova-deep)] border-b border-[var(--nova-border)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileCode className="w-4 h-4 text-[var(--nova-accent)] shrink-0" />
          <div className="flex items-center gap-2 min-w-0 font-mono text-xs">
            <span className="font-semibold text-[var(--nova-text-primary)] truncate">{file.name}</span>
            <span className="text-[var(--nova-text-muted)] hidden sm:inline truncate">({file.path})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* File Meta Badges */}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)]">
            {formatSize(file.size)}
          </span>

          {file.language && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(99,102,241,0.1)] text-[var(--nova-accent)] border border-[rgba(99,102,241,0.2)]">
              {file.language}
            </span>
          )}

          {file.type === "file" && (
            <>
              {/* Toggle Wrap */}
              <button
                type="button"
                onClick={() => setWrapLines(!wrapLines)}
                title={wrapLines ? "Disable word wrap" : "Enable word wrap"}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer ${
                  wrapLines
                    ? "bg-[var(--nova-accent)] text-white border-[var(--nova-accent)]"
                    : "bg-[var(--nova-surface)] text-[var(--nova-text-secondary)] border-[var(--nova-border)] hover:bg-[var(--nova-deep)] hover:text-[var(--nova-text-primary)]"
                }`}
              >
                <WrapText className="w-3.5 h-3.5" />
              </button>

              {/* Copy Code */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy source code"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] text-xs font-mono transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
              </button>
            </>
          )}

          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open file on GitHub"
              className="p-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Main File Content Viewport */}
      <div className="flex-1 overflow-auto bg-[var(--nova-bg)] min-h-[350px] relative">
        {file.type === "file_too_large" ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center my-12">
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[var(--nova-text-primary)]">File Exceeds Size Limit</h4>
              <p className="text-xs text-[var(--nova-text-secondary)] max-w-sm">
                This file is <strong>{formatSize(file.size)}</strong>, which exceeds the maximum preview limit of{" "}
                <strong>{formatSize(file.maxSize || 1048576)}</strong>.
              </p>
            </div>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-xs font-medium text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View on GitHub</span>
              </a>
            )}
          </div>
        ) : file.type === "binary" ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center my-12">
            <div className="p-3 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--nova-accent)] border border-[rgba(99,102,241,0.2)]">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[var(--nova-text-primary)]">Binary File</h4>
              <p className="text-xs text-[var(--nova-text-secondary)]">
                Size: <span className="font-mono text-[var(--nova-text-primary)]">{formatSize(file.size)}</span> • Preview unavailable for binary format.
              </p>
            </div>
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-xs font-medium text-[var(--nova-text-primary)] hover:bg-[var(--nova-deep)] transition-colors mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Download from GitHub</span>
              </a>
            )}
          </div>
        ) : (
          /* Normal Read-Only Code View with Line Numbers */
          <div className="flex font-mono text-xs leading-relaxed min-w-full w-max">
            {/* Line Numbers Gutter */}
            <div className="select-none py-3 px-3 text-right bg-[var(--nova-deep)] text-[var(--nova-text-muted)] border-r border-[var(--nova-border)] shrink-0 sticky left-0 z-10">
              {lines.map((_, i) => (
                <div key={i} className="leading-5 h-5 text-[11px]">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Lines Body */}
            <div
              className={`py-3 px-4 flex-1 text-[var(--nova-text-primary)] overflow-x-auto ${
                wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre"
              }`}
            >
              {lines.map((line, i) => (
                <div key={i} className="leading-5 h-5 font-mono">
                  {line || "\u00A0"}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div className="px-4 py-1.5 bg-[var(--nova-deep)] border-t border-[var(--nova-border)] flex items-center justify-between text-[10px] font-mono text-[var(--nova-text-muted)]">
        <span>Read-Only Source View</span>
        <span>
          Branch: <strong className="text-[var(--nova-text-secondary)]">{branch}</strong>
          {file.sha && (
            <>
              {" "}• SHA: <strong className="text-[var(--nova-text-secondary)]">{file.sha.slice(0, 7)}</strong>
            </>
          )}
        </span>
      </div>
    </div>
  );
};
