"use client";

import React from "react";
import {
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  ChevronRight,
  ArrowUpLeft,
  RefreshCw,
  AlertCircle,
  FolderGit2,
} from "lucide-react";

export interface ITreeItemData {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size?: number;
  sha?: string;
}

interface DirectoryTreeProps {
  items: ITreeItemData[];
  currentPath: string;
  selectedFilePath: string | null;
  isLoading: boolean;
  error?: string | null;
  onNavigatePath: (path: string) => void;
  onSelectFile: (path: string) => void;
  onRefresh: () => void;
}

export const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  items,
  currentPath,
  selectedFilePath,
  isLoading,
  error,
  onNavigatePath,
  onSelectFile,
  onRefresh,
}) => {
  const pathParts = currentPath.split("/").filter(Boolean);

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (filename: string) => {
    const lower = filename.toLowerCase();
    if (
      lower.endsWith(".ts") ||
      lower.endsWith(".tsx") ||
      lower.endsWith(".js") ||
      lower.endsWith(".jsx") ||
      lower.endsWith(".py") ||
      lower.endsWith(".go") ||
      lower.endsWith(".rs") ||
      lower.endsWith(".json")
    ) {
      return <FileCode className="w-4 h-4 text-[var(--nova-accent)] shrink-0" />;
    }
    if (lower.endsWith(".md") || lower.endsWith(".txt") || lower.startsWith("readme")) {
      return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    return <File className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />;
  };

  const handleParentDirectory = () => {
    if (pathParts.length <= 1) {
      onNavigatePath("");
    } else {
      const parent = pathParts.slice(0, -1).join("/");
      onNavigatePath(parent);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Breadcrumb Navigation Bar */}
      <div className="p-3 bg-[var(--nova-deep)] border-b border-[var(--nova-border)] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => onNavigatePath("")}
            className={`flex items-center gap-1 hover:text-[var(--nova-accent)] transition-colors cursor-pointer ${
              !currentPath ? "font-semibold text-[var(--nova-text-primary)]" : "text-[var(--nova-text-secondary)]"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>root</span>
          </button>

          {pathParts.map((part, index) => {
            const partPath = pathParts.slice(0, index + 1).join("/");
            const isLast = index === pathParts.length - 1;
            return (
              <React.Fragment key={partPath}>
                <ChevronRight className="w-3 h-3 text-[var(--nova-text-muted)] shrink-0" />
                <button
                  type="button"
                  onClick={() => onNavigatePath(partPath)}
                  className={`hover:text-[var(--nova-accent)] transition-colors truncate max-w-[120px] cursor-pointer ${
                    isLast ? "font-semibold text-[var(--nova-text-primary)]" : "text-[var(--nova-text-secondary)]"
                  }`}
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {currentPath && (
            <button
              type="button"
              onClick={handleParentDirectory}
              title="Up to parent folder"
              className="p-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer"
            >
              <ArrowUpLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh directory"
            className="p-1 rounded-md bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[var(--nova-accent)]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Directory Contents List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-[300px]">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--nova-text-muted)]">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
            <span>Loading files & folders...</span>
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs text-[var(--nova-text-secondary)]">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="text-xs font-mono text-[var(--nova-accent)] hover:underline cursor-pointer"
            >
              Try reloading
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--nova-text-muted)]">
            This directory is empty.
          </div>
        ) : (
          items.map((item) => {
            const isDir = item.type === "dir";
            const isSelected = selectedFilePath === item.path;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  if (isDir) {
                    onNavigatePath(item.path);
                  } else {
                    onSelectFile(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[rgba(99,102,241,0.15)] text-[var(--nova-accent)] font-medium border border-[rgba(99,102,241,0.3)]"
                    : "hover:bg-[var(--nova-deep)] text-[var(--nova-text-primary)] border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isDir ? (
                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    getFileIcon(item.name)
                  )}
                  <span className="truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[10px] text-[var(--nova-text-muted)]">
                  {item.size !== undefined && !isDir && (
                    <span>{formatSize(item.size)}</span>
                  )}
                  {isDir && (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--nova-text-muted)]" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Directory Item Summary Footer */}
      <div className="px-3 py-1.5 bg-[var(--nova-deep)] border-t border-[var(--nova-border)] flex items-center justify-between text-[10px] font-mono text-[var(--nova-text-muted)]">
        <span>{items.length} items</span>
        <span>Path: {currentPath ? `/${currentPath}` : "/ (root)"}</span>
      </div>
    </div>
  );
};
