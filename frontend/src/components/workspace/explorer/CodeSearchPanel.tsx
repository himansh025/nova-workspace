"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, FileCode, RefreshCw, AlertCircle, ArrowRight } from "lucide-react";
import { apiFetchInit } from "@/lib/apiHeaders";

export interface ISearchResultItem {
  name: string;
  path: string;
  sha: string;
  htmlUrl: string;
  repository: string;
  matches?: Array<{
    fragment: string;
    indices?: number[];
  }>;
}

interface CodeSearchPanelProps {
  repositoryId: string;
  branch: string;
  onSelectResult: (filePath: string) => void;
}

export const CodeSearchPanel: React.FC<CodeSearchPanelProps> = ({
  repositoryId,
  branch,
  onSelectResult,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ISearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const activeSearchRef = useRef<string>("");

  useEffect(() => {
    // Reset when repository changes
    setQuery("");
    setResults([]);
    setTotalCount(null);
    setError(null);
  }, [repositoryId, branch]);

  const executeSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || !repositoryId) {
      setResults([]);
      setTotalCount(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    activeSearchRef.current = trimmed;

    try {
      const res = await fetch(
        `/api/integrations/github/repositories/${encodeURIComponent(repositoryId)}/search?q=${encodeURIComponent(trimmed)}&branch=${encodeURIComponent(branch)}`,
        apiFetchInit()
      );
      const data = await res.json();

      // Guard against race conditions
      if (activeSearchRef.current !== trimmed) return;

      if (data.success && Array.isArray(data.items)) {
        setResults(data.items);
        setTotalCount(data.totalCount || data.items.length);
      } else {
        setError(data.error || "Search failed.");
        setResults([]);
      }
    } catch (err: any) {
      if (activeSearchRef.current === trimmed) {
        setError(err.message || "Network error during code search.");
        setResults([]);
      }
    } finally {
      if (activeSearchRef.current === trimmed) {
        setIsLoading(false);
      }
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (!val.trim()) {
      setResults([]);
      setTotalCount(null);
      setIsLoading(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, 300);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setTotalCount(null);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--nova-surface)] border border-[var(--nova-border)] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* Search Bar Header */}
      <div className="p-3 bg-[var(--nova-deep)] border-b border-[var(--nova-border)] space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--nova-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code in repository..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--nova-surface)] border border-[var(--nova-border)] text-[var(--nova-text-primary)] text-xs font-mono focus:outline-hidden focus:border-[var(--nova-accent)] placeholder-[var(--nova-text-muted)]"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--nova-text-muted)] hover:text-[var(--nova-text-primary)] p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {totalCount !== null && !isLoading && (
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--nova-text-muted)] px-1">
            <span>
              Found <strong>{totalCount}</strong> {totalCount === 1 ? "match" : "matches"}
            </span>
            <span>Scoped to {branch}</span>
          </div>
        )}
      </div>

      {/* Results Viewport */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[300px]">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[var(--nova-text-muted)]">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--nova-accent)]" />
            <span>Searching repository...</span>
          </div>
        ) : error ? (
          <div className="py-8 px-4 text-center space-y-2">
            <AlertCircle className="w-5 h-5 text-rose-500 mx-auto" />
            <p className="text-xs text-[var(--nova-text-secondary)]">{error}</p>
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--nova-text-muted)] space-y-1">
            <div>No matching code results found.</div>
            <div className="text-[10px]">Try refining your search keyword.</div>
          </div>
        ) : !query.trim() ? (
          <div className="py-12 text-center text-xs text-[var(--nova-text-muted)] space-y-1">
            <div>Enter a keyword to search this repository.</div>
            <div className="text-[10px] text-[var(--nova-text-muted)]">
              Search is strictly scoped to the selected branch.
            </div>
          </div>
        ) : (
          results.map((res, i) => (
            <button
              key={`${res.path}-${i}`}
              type="button"
              onClick={() => onSelectResult(res.path)}
              className="w-full p-3 rounded-lg bg-[var(--nova-bg)] border border-[var(--nova-border)] hover:border-[var(--nova-accent)] text-left transition-all space-y-2 group cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 font-mono text-xs text-[var(--nova-text-primary)] font-medium">
                  <FileCode className="w-3.5 h-3.5 text-[var(--nova-accent)] shrink-0" />
                  <span className="truncate group-hover:text-[var(--nova-accent)] transition-colors">
                    {res.path}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--nova-text-muted)] group-hover:text-[var(--nova-accent)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              {res.matches && res.matches.length > 0 && (
                <div className="bg-[var(--nova-surface)] p-2 rounded border border-[var(--nova-border)] font-mono text-[11px] text-[var(--nova-text-secondary)] whitespace-pre-wrap break-all leading-tight">
                  {res.matches[0].fragment.trim().slice(0, 200)}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};
