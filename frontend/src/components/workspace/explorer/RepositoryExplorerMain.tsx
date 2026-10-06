"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FolderGit2,
  GitBranch,
  Search,
  GitCommit,
  Layers,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileCode2,
} from "lucide-react";
import { apiFetchInit } from "@/lib/apiHeaders";
import { useToast } from "@/components/workspace/ToastProvider";
import { DirectoryTree, ITreeItemData } from "./DirectoryTree";
import { CodeViewer, IFileViewData } from "./CodeViewer";
import { CodeSearchPanel } from "./CodeSearchPanel";
import { CommitHistoryPanel } from "./CommitHistoryPanel";
import { RepositoryOverviewPanel } from "./RepositoryOverviewPanel";

interface IRepoItem {
  id: string;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  selectedBranch?: string;
  selected?: boolean;
  htmlUrl: string;
}

interface IBranchItem {
  name: string;
  protected: boolean;
  isDefault?: boolean;
}

type ExplorerTab = "tree" | "search" | "commits" | "overview";

export const RepositoryExplorerMain: React.FC = () => {
  const { addToast } = useToast();

  // App & Repositories State
  const [repositories, setRepositories] = useState<IRepoItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<IRepoItem | null>(null);
  const [branches, setBranches] = useState<IBranchItem[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [activeTab, setActiveTab] = useState<ExplorerTab>("tree");

  // Tree & Directory Navigation State
  const [currentPath, setCurrentPath] = useState<string>("");
  const [treeItems, setTreeItems] = useState<ITreeItemData[]>([]);
  const [isLoadingTree, setIsLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);

  // File Viewer State
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileData, setFileData] = useState<IFileViewData | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Status & Loading State
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [appConnected, setAppConnected] = useState(false);

  // Race condition protection token refs
  const currentTreeRequestRef = useRef<number>(0);
  const currentFileRequestRef = useRef<number>(0);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    setIsLoadingApp(true);
    try {
      const res = await fetch("/api/integrations/github/repositories", apiFetchInit());
      const data = await res.json();
      if (data.success && Array.isArray(data.repositories)) {
        setRepositories(data.repositories);
        setAppConnected(data.installationActive || data.repositories.length > 0);

        const defaultSelected =
          data.repositories.find((r: IRepoItem) => r.selected) ||
          data.repositories[0] ||
          null;

        if (defaultSelected) {
          setSelectedRepo(defaultSelected);
          const initialBranch = defaultSelected.selectedBranch || defaultSelected.defaultBranch || "main";
          setSelectedBranch(initialBranch);
          loadBranches(defaultSelected.id, initialBranch);
          loadDirectory(defaultSelected.id, initialBranch, "");
        }
      }
    } catch (err: any) {
      console.error("Failed to load repositories:", err);
    } finally {
      setIsLoadingApp(false);
    }
  };

  const loadBranches = async (repoId: string, currentBranchName?: string) => {
    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repoId)}/branches`,
        apiFetchInit()
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches);
        if (currentBranchName) {
          setSelectedBranch(currentBranchName);
        } else if (data.branches.length > 0) {
          const def = data.branches.find((b: IBranchItem) => b.isDefault) || data.branches[0];
          setSelectedBranch(def.name);
        }
      }
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  const loadDirectory = async (repoId: string, branch: string, path: string) => {
    const requestId = ++currentTreeRequestRef.current;
    setIsLoadingTree(true);
    setTreeError(null);

    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repoId)}/tree?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`,
        apiFetchInit()
      );
      const data = await res.json();

      // Guard against stale async responses
      if (requestId !== currentTreeRequestRef.current) return;

      if (data.success && Array.isArray(data.items)) {
        setTreeItems(data.items);
        setCurrentPath(path);
      } else {
        setTreeError(data.error || "Unable to read directory.");
        setTreeItems([]);
      }
    } catch (err: any) {
      if (requestId === currentTreeRequestRef.current) {
        setTreeError(err.message || "Network error loading directory.");
        setTreeItems([]);
      }
    } finally {
      if (requestId === currentTreeRequestRef.current) {
        setIsLoadingTree(false);
      }
    }
  };

  const loadFile = async (repoId: string, branch: string, path: string) => {
    const requestId = ++currentFileRequestRef.current;
    setIsLoadingFile(true);
    setFileError(null);
    setSelectedFilePath(path);

    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repoId)}/file?branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}`,
        apiFetchInit()
      );
      const data = await res.json();

      // Guard against stale async responses
      if (requestId !== currentFileRequestRef.current) return;

      if (data.success && data.file) {
        setFileData(data.file);
      } else {
        setFileError(data.error || "Unable to load file.");
        setFileData(null);
      }
    } catch (err: any) {
      if (requestId === currentFileRequestRef.current) {
        setFileError(err.message || "Network error loading file.");
        setFileData(null);
      }
    } finally {
      if (requestId === currentFileRequestRef.current) {
        setIsLoadingFile(false);
      }
    }
  };

  const handleSelectRepository = (repoId: string) => {
    const repo = repositories.find((r) => r.id === repoId || String(r.githubRepositoryId) === repoId);
    if (!repo) return;

    setSelectedRepo(repo);
    const branch = repo.selectedBranch || repo.defaultBranch || "main";
    setSelectedBranch(branch);

    // Reset tree and file states cleanly
    setCurrentPath("");
    setSelectedFilePath(null);
    setFileData(null);
    setFileError(null);

    loadBranches(repo.id, branch);
    loadDirectory(repo.id, branch, "");
  };

  const handleSelectBranch = (branchName: string) => {
    if (!selectedRepo) return;
    setSelectedBranch(branchName);

    // Reset tree and file states cleanly for new branch
    setCurrentPath("");
    setSelectedFilePath(null);
    setFileData(null);
    setFileError(null);

    loadDirectory(selectedRepo.id, branchName, "");
  };

  const handleNavigatePath = (path: string) => {
    if (!selectedRepo) return;
    loadDirectory(selectedRepo.id, selectedBranch, path);
  };

  const handleSelectFile = (path: string) => {
    if (!selectedRepo) return;
    loadFile(selectedRepo.id, selectedBranch, path);
  };

  const handleSelectSearchResult = (filePath: string) => {
    if (!selectedRepo) return;
    setActiveTab("tree");

    // Navigate to folder of that file if needed
    const lastSlash = filePath.lastIndexOf("/");
    const dir = lastSlash !== -1 ? filePath.slice(0, lastSlash) : "";
    loadDirectory(selectedRepo.id, selectedBranch, dir);
    loadFile(selectedRepo.id, selectedBranch, filePath);
  };

  if (isLoadingApp) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-xs text-[var(--nova-text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--nova-accent)]" />
        <span className="font-mono">Loading connected GitHub repositories...</span>
      </div>
    );
  }

  if (!appConnected || repositories.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] text-center space-y-4 max-w-lg mx-auto my-12 shadow-sm">
        <div className="p-3.5 rounded-full bg-[rgba(99,102,241,0.1)] text-[var(--nova-accent)] w-fit mx-auto border border-[rgba(99,102,241,0.2)]">
          <FolderGit2 className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-[var(--nova-text-primary)]">
            No GitHub Repository Connected
          </h3>
          <p className="text-xs text-[var(--nova-text-secondary)] leading-relaxed">
            Connect your GitHub App installation in Settings to securely browse repository source code, directories, commits, and code search.
          </p>
        </div>
        <a
          href="/app/settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--nova-accent)] hover:bg-[var(--nova-accent-hover)] text-white text-xs font-medium transition-colors"
        >
          <span>Configure GitHub App</span>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ─── TOP CONTROL BAR: REPOSITORY & BRANCH SELECTOR ───────────────────── */}
      <div className="p-4 rounded-xl bg-[var(--nova-surface)] border border-[var(--nova-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Repository Selector */}
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[var(--nova-accent)] shrink-0" />
            <select
              value={selectedRepo?.id || ""}
              onChange={(e) => handleSelectRepository(e.target.value)}
              className="px-3 py-1.5 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono font-semibold focus:outline-hidden focus:border-[var(--nova-accent)] cursor-pointer"
            >
              {repositories.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fullName} {r.private ? "🔒" : "🌐"}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Selector */}
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[var(--nova-text-muted)] shrink-0" />
            <select
              value={selectedBranch}
              onChange={(e) => handleSelectBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} {b.protected ? "🛡️" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Controls & External Link */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("tree")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
              activeTab === "tree"
                ? "bg-[var(--nova-accent)] text-white font-medium"
                : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] border border-[var(--nova-border)]"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
              activeTab === "search"
                ? "bg-[var(--nova-accent)] text-white font-medium"
                : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] border border-[var(--nova-border)]"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("commits")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
              activeTab === "commits"
                ? "bg-[var(--nova-accent)] text-white font-medium"
                : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] border border-[var(--nova-border)]"
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Commits</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0 ${
              activeTab === "overview"
                ? "bg-[var(--nova-accent)] text-white font-medium"
                : "bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] border border-[var(--nova-border)]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Context</span>
          </button>

          {selectedRepo?.htmlUrl && (
            <a
              href={selectedRepo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open repository on GitHub"
              className="p-1.5 rounded-md bg-[var(--nova-bg)] border border-[var(--nova-border)] text-[var(--nova-text-secondary)] hover:text-[var(--nova-text-primary)] transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* ─── MAIN RESPONSIVE VIEWPORT ────────────────────────────────────────── */}
      {activeTab === "overview" ? (
        <RepositoryOverviewPanel
          repositoryId={selectedRepo?.id || ""}
          branch={selectedBranch}
        />
      ) : activeTab === "commits" ? (
        <CommitHistoryPanel
          repositoryId={selectedRepo?.id || ""}
          branch={selectedBranch}
        />
      ) : activeTab === "search" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-5 h-[650px]">
            <CodeSearchPanel
              repositoryId={selectedRepo?.id || ""}
              branch={selectedBranch}
              onSelectResult={handleSelectSearchResult}
            />
          </div>
          <div className="lg:col-span-7 h-[650px]">
            <CodeViewer
              file={fileData}
              branch={selectedBranch}
              repositoryFullName={selectedRepo?.fullName}
              isLoading={isLoadingFile}
              error={fileError}
              onRetry={() => {
                if (selectedRepo && selectedFilePath) {
                  loadFile(selectedRepo.id, selectedBranch, selectedFilePath);
                }
              }}
            />
          </div>
        </div>
      ) : (
        /* Default: Tree + Code Viewer Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4 h-[650px]">
            <DirectoryTree
              items={treeItems}
              currentPath={currentPath}
              selectedFilePath={selectedFilePath}
              isLoading={isLoadingTree}
              error={treeError}
              onNavigatePath={handleNavigatePath}
              onSelectFile={handleSelectFile}
              onRefresh={() => {
                if (selectedRepo) {
                  loadDirectory(selectedRepo.id, selectedBranch, currentPath);
                }
              }}
            />
          </div>

          <div className="lg:col-span-8 h-[650px]">
            <CodeViewer
              file={fileData}
              branch={selectedBranch}
              repositoryFullName={selectedRepo?.fullName}
              isLoading={isLoadingFile}
              error={fileError}
              onRetry={() => {
                if (selectedRepo && selectedFilePath) {
                  loadFile(selectedRepo.id, selectedBranch, selectedFilePath);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
