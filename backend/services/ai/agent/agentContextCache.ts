import { AGENT_CONFIG } from "./agentConfig";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const metadataCache = new Map<string, CacheEntry<string>>();
const treeCache = new Map<string, CacheEntry<string[]>>();
const symbolCache = new Map<string, CacheEntry<Record<string, string[]>>>();

function cacheKey(parts: string[]): string {
  return parts.join("|");
}

function getCached<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = map.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    map.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached<T>(map: Map<string, CacheEntry<T>>, key: string, value: T): void {
  if (map.size > AGENT_CONFIG.contextCacheMaxEntries) {
    const first = map.keys().next().value;
    if (first) map.delete(first);
  }
  map.set(key, {
    value,
    expiresAt: Date.now() + AGENT_CONFIG.contextCacheTtlMs,
  });
}

export const agentContextCache = {
  getRepositoryMetadata(organizationId: string, repositoryId: string): string | undefined {
    return getCached(metadataCache, cacheKey(["meta", organizationId, repositoryId]));
  },

  setRepositoryMetadata(organizationId: string, repositoryId: string, block: string): void {
    setCached(metadataCache, cacheKey(["meta", organizationId, repositoryId]), block);
  },

  getFileTree(organizationId: string, repositoryId: string, branch: string): string[] | undefined {
    return getCached(treeCache, cacheKey(["tree", organizationId, repositoryId, branch]));
  },

  setFileTree(organizationId: string, repositoryId: string, branch: string, lines: string[]): void {
    setCached(treeCache, cacheKey(["tree", organizationId, repositoryId, branch]), lines);
  },

  getSymbolIndex(
    organizationId: string,
    repositoryId: string,
    branch: string
  ): Record<string, string[]> | undefined {
    return getCached(symbolCache, cacheKey(["sym", organizationId, repositoryId, branch]));
  },

  setSymbolIndex(
    organizationId: string,
    repositoryId: string,
    branch: string,
    index: Record<string, string[]>
  ): void {
    setCached(symbolCache, cacheKey(["sym", organizationId, repositoryId, branch]), index);
  },

  clearAll(): void {
    metadataCache.clear();
    treeCache.clear();
    symbolCache.clear();
  },
};
