import crypto from "crypto";
import { ENV } from "../config/env";
import { RepositoryModel, IRepositoryDocument } from "../models/Repository";
import { GitHubInstallationModel } from "../models/GitHubInstallation";
import { githubAppService } from "./githubAppService";
import { githubService } from "./githubService";

// ─── TYPES & INTERFACES ───────────────────────────────────────────────────────

export interface IRepoMetadata {
  id: string;
  githubRepositoryId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  private: boolean;
  visibility: "public" | "private";
  archived: boolean;
  defaultBranch: string;
  selectedBranch: string;
  htmlUrl: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITreeItem {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
  size?: number;
  sha?: string;
  downloadUrl?: string | null;
  htmlUrl?: string;
}

export interface IFileResponse {
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

export interface ICodeSearchItem {
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
  committer?: {
    name: string;
    email?: string;
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
    status: "added" | "removed" | "modified" | "renamed" | string;
    additions: number;
    deletions: number;
    changes: number;
    patchSummary?: string;
  }>;
}

// ─── IN-MEMORY CACHING LAYER ──────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();
const MAX_CACHE_ENTRIES = 500;

function getCached<T>(key: string): T | undefined {
  const entry = MEMORY_CACHE.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    MEMORY_CACHE.delete(key);
    return undefined;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  if (MEMORY_CACHE.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entries
    const firstKey = MEMORY_CACHE.keys().next().value;
    if (firstKey) MEMORY_CACHE.delete(firstKey);
  }
  MEMORY_CACHE.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function clearExplorerCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    MEMORY_CACHE.clear();
    return;
  }
  for (const key of MEMORY_CACHE.keys()) {
    if (key.startsWith(keyPrefix)) {
      MEMORY_CACHE.delete(key);
    }
  }
}

// ─── SECURITY & PATH VALIDATION HELPERS ────────────────────────────────────────

const BINARY_EXTENSIONS = new Set([
  // Images
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff", ".psd", ".raw", ".svgz",
  // Media / Audio / Video
  ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".mp4", ".webm", ".mkv", ".avi", ".mov", ".flv",
  // Archives & Compressed
  ".pdf", ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar", ".xz", ".iso", ".dmg", ".pkg", ".deb", ".rpm",
  // Executables & Binaries
  ".exe", ".dll", ".so", ".dylib", ".bin", ".class", ".jar", ".war", ".ear", ".pyc", ".pyo", ".pyd", ".wasm", ".o", ".a", ".lib",
  // Fonts
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  // Office docs (binary)
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);

export function isBinaryFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  const lastDot = lower.lastIndexOf(".");
  if (lastDot === -1) return false;
  const ext = lower.slice(lastDot);
  return BINARY_EXTENSIONS.has(ext);
}

export function isBinaryBuffer(buffer: Buffer): boolean {
  const checkLength = Math.min(buffer.length, 1024);
  if (checkLength === 0) return false;

  let nonPrintable = 0;
  for (let i = 0; i < checkLength; i++) {
    const byte = buffer[i];
    // Check for null byte
    if (byte === 0) return true;
    // Non-printable control characters (excluding tab, LF, CR)
    if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte === 127) {
      nonPrintable++;
    }
  }
  return nonPrintable / checkLength > 0.25;
}

export function detectLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower === "package.json" || lower === "tsconfig.json") return "json";
  if (lower === "dockerfile" || lower.startsWith("dockerfile.")) return "dockerfile";
  if (lower === "makefile" || lower === "gnumakefile") return "makefile";
  if (lower === "cargo.toml" || lower === "pyproject.toml") return "toml";
  if (lower === "go.mod" || lower === "go.sum") return "go-mod";

  const lastDot = lower.lastIndexOf(".");
  if (lastDot === -1) return "plaintext";
  const ext = lower.slice(lastDot);

  const langMap: Record<string, string> = {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".mdx": "markdown",
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".less": "less",
    ".py": "python",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".c": "c",
    ".cpp": "cpp",
    ".cc": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".sh": "shell",
    ".bash": "shell",
    ".zsh": "shell",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".sql": "sql",
    ".graphql": "graphql",
    ".gql": "graphql",
    ".xml": "xml",
    ".svg": "xml",
    ".env": "properties",
    ".properties": "properties",
    ".ini": "ini",
  };

  return langMap[ext] || "plaintext";
}

export function normalizeAndValidatePath(rawPath?: string): string {
  if (!rawPath || typeof rawPath !== "string") return "";

  const trimmed = rawPath.trim();
  if (trimmed === "" || trimmed === "/" || trimmed === ".") return "";

  if (trimmed.length > 500) {
    throw new Error("Path exceeds maximum permitted length of 500 characters.");
  }

  // Reject null-bytes or control characters
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    throw new Error("Path contains illegal control characters or null bytes.");
  }

  // Decode URI component to check for encoded attacks
  let decoded = "";
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    throw new Error("Malformed URI encoding in path.");
  }

  // Check for path traversal attempts or backslashes
  if (
    decoded.includes("..") ||
    decoded.includes("\\") ||
    /(^|\/)\.\.(\/|$)/.test(decoded)
  ) {
    throw new Error("Path traversal sequence detected. Access denied.");
  }

  // Normalize and strip leading/trailing slashes
  const parts = decoded.split("/").filter(Boolean);
  for (const part of parts) {
    if (part === "." || part === "..") {
      throw new Error("Invalid path segment.");
    }
  }

  return parts.join("/");
}

export function validateBranch(branch?: string, defaultBranch = "main"): string {
  if (!branch || typeof branch !== "string" || !branch.trim()) {
    return defaultBranch;
  }
  const clean = branch.trim();
  if (clean.length > 255) {
    throw new Error("Branch name exceeds maximum length of 255 characters.");
  }
  if (/[\x00-\x1f\x7f\s]/.test(clean) || clean.includes("..") || clean.startsWith("-")) {
    throw new Error("Invalid or unsafe branch name provided.");
  }
  return clean;
}

export function validateSearchQuery(query?: string): string {
  if (!query || typeof query !== "string") {
    throw new Error("Search query 'q' parameter is required.");
  }
  const clean = query.trim();
  if (clean.length === 0) {
    throw new Error("Search query cannot be empty.");
  }
  if (clean.length > 200) {
    throw new Error("Search query exceeds maximum length of 200 characters.");
  }
  if (/[\x00-\x1f\x7f]/.test(clean)) {
    throw new Error("Search query contains illegal characters.");
  }
  return clean;
}

export function validatePagination(
  rawPage?: any,
  rawPerPage?: any,
  maxPerPage = 100
): { page: number; perPage: number } {
  let page = Number(rawPage);
  if (!Number.isInteger(page) || page < 1) page = 1;

  let perPage = Number(rawPerPage);
  if (!Number.isInteger(perPage) || perPage < 1) perPage = 30;
  if (perPage > maxPerPage) perPage = maxPerPage;

  return { page, perPage };
}

// ─── ERROR HANDLING & SAFE GITHUB CLIENT ──────────────────────────────────────

export class GitHubExplorerError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = "GITHUB_EXPLORER_ERROR") {
    super(message);
    this.name = "GitHubExplorerError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function fetchFromGitHub(
  endpoint: string,
  token?: string,
  customHeaders?: Record<string, string>
): Promise<Response> {
  const url = endpoint.startsWith("https://") ? endpoint : `https://api.github.com${endpoint}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Nova-Workspace-App",
    "X-GitHub-Api-Version": "2022-11-28",
    ...customHeaders,
  };

  if (token && token.trim().length > 0) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }

  const timeoutMs = ENV.GITHUB_REQUEST_TIMEOUT_MS || 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    return res;
  } catch (err: any) {
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      throw new GitHubExplorerError("GitHub request timed out after 10 seconds.", 504, "GITHUB_TIMEOUT");
    }
    throw new GitHubExplorerError(`Network connection to GitHub failed: ${err.message}`, 502, "GITHUB_NETWORK_ERROR");
  } finally {
    clearTimeout(timer);
  }
}

function handleGitHubResponseError(res: Response, resourceType = "resource"): never {
  const status = res.status;
  const remaining = res.headers.get("x-ratelimit-remaining");

  if (status === 403 && remaining === "0") {
    const resetTime = res.headers.get("x-ratelimit-reset");
    const resetDate = resetTime ? new Date(Number(resetTime) * 1000).toLocaleTimeString() : "soon";
    throw new GitHubExplorerError(
      `GitHub API rate limit reached. Access will reset at ${resetDate}.`,
      429,
      "RATE_LIMIT_EXCEEDED"
    );
  }

  if (status === 401) {
    throw new GitHubExplorerError("GitHub App authentication failed or token expired.", 401, "UNAUTHORIZED");
  }
  if (status === 403) {
    throw new GitHubExplorerError("GitHub permission denied for this repository.", 403, "FORBIDDEN");
  }
  if (status === 404) {
    throw new GitHubExplorerError(`GitHub ${resourceType} was not found on the specified branch or path.`, 404, "NOT_FOUND");
  }
  if (status === 409) {
    throw new GitHubExplorerError("Repository is empty or Git tree is temporarily unavailable.", 409, "CONFLICT");
  }
  if (status === 422) {
    throw new GitHubExplorerError("GitHub rejected the request arguments.", 422, "UNPROCESSABLE_ENTITY");
  }
  if (status >= 500) {
    throw new GitHubExplorerError("GitHub service is currently unavailable.", 503, "GITHUB_UNAVAILABLE");
  }

  throw new GitHubExplorerError(`GitHub API returned error status ${status}.`, status, "GITHUB_ERROR");
}

// ─── GITHUB REPOSITORY EXPLORER SERVICE ───────────────────────────────────────

export const githubRepositoryExplorerService = {
  /**
   * Strictly verifies the authorization chain:
   * Session Org -> Active GitHub Installation -> Target Repository
   */
  async verifyAndGetRepository(
    organizationId: string,
    repositoryId: string
  ): Promise<{
    repository: IRepositoryDocument;
    token?: string;
    installationActive: boolean;
  }> {
    if (!organizationId) {
      throw new GitHubExplorerError("Organization context is required.", 401, "UNAUTHORIZED");
    }
    if (!repositoryId) {
      throw new GitHubExplorerError("Repository identifier is required.", 400, "BAD_REQUEST");
    }

    // Lookup repository strictly isolated to this organization
    const repository = await RepositoryModel.findOne({
      organizationId,
      $or: [
        { id: repositoryId },
        { fullName: repositoryId },
        ...(Number.isInteger(Number(repositoryId)) ? [{ githubRepositoryId: Number(repositoryId) }] : []),
      ],
    });

    if (!repository) {
      throw new GitHubExplorerError(
        "Repository not found or not accessible within this organization.",
        404,
        "REPOSITORY_NOT_FOUND"
      );
    }

    // Verify installation status for this repo's installation
    const installation = await GitHubInstallationModel.findOne({
      organizationId,
      githubInstallationId: repository.githubInstallationId,
      status: "ACTIVE",
    });

    if (!installation) {
      // Fallback check to legacy PAT if enabled
      const auth = await githubService.getGitHubAuth(organizationId);
      if (auth.provider === "legacy_pat" && auth.token) {
        return {
          repository,
          token: auth.token,
          installationActive: true,
        };
      }

      throw new GitHubExplorerError(
        "GitHub App installation for this repository is not active or has been revoked.",
        403,
        "INSTALLATION_INACTIVE"
      );
    }

    // Generate ephemeral token if GitHub App is configured
    let token: string | undefined;
    if (githubAppService.isConfigured()) {
      try {
        token = await githubAppService.createInstallationToken(installation.githubInstallationId);
      } catch (err: any) {
        console.warn(`[githubRepositoryExplorer] Installation token generation notice: ${err.message}`);
      }
    }

    return {
      repository,
      token,
      installationActive: true,
    };
  },

  /**
   * Safe metadata endpoint: GET /repositories/:repositoryId
   */
  async getRepositoryMetadata(organizationId: string, repositoryId: string): Promise<IRepoMetadata> {
    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);

    const cacheKey = `meta:${organizationId}:${repository.id}`;
    const cached = getCached<IRepoMetadata>(cacheKey);
    if (cached) return cached;

    let meta: Partial<IRepoMetadata> = {};

    try {
      const res = await fetchFromGitHub(`/repos/${repository.fullName}`, token);
      if (res.ok) {
        const ghData: any = await res.json();
        meta = {
          description: ghData.description || "",
          private: Boolean(ghData.private),
          visibility: ghData.visibility || (ghData.private ? "private" : "public"),
          archived: Boolean(ghData.archived),
          defaultBranch: ghData.default_branch || repository.defaultBranch || "main",
          htmlUrl: ghData.html_url || repository.htmlUrl,
          language: ghData.language || "",
          createdAt: ghData.created_at || repository.createdAt.toISOString(),
          updatedAt: ghData.updated_at || repository.updatedAt.toISOString(),
        };
      }
    } catch {
      // Fall back to database metadata if GitHub is unreachable
    }

    const result: IRepoMetadata = {
      id: repository.id,
      githubRepositoryId: repository.githubRepositoryId,
      owner: repository.owner,
      name: repository.name,
      fullName: repository.fullName,
      description: meta.description || "",
      private: meta.private !== undefined ? meta.private : repository.private,
      visibility: meta.visibility || (repository.private ? "private" : "public"),
      archived: meta.archived !== undefined ? meta.archived : repository.archived,
      defaultBranch: meta.defaultBranch || repository.defaultBranch || "main",
      selectedBranch: repository.selectedBranch || meta.defaultBranch || repository.defaultBranch || "main",
      htmlUrl: meta.htmlUrl || repository.htmlUrl || `https://github.com/${repository.fullName}`,
      language: meta.language || "",
      createdAt: meta.createdAt || repository.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: meta.updatedAt || repository.updatedAt?.toISOString?.() || new Date().toISOString(),
    };

    setCached(cacheKey, result, 60);
    return result;
  },

  /**
   * Branch listing endpoint: GET /repositories/:repositoryId/branches
   */
  async listBranches(
    organizationId: string,
    repositoryId: string,
    rawPage = 1,
    rawPerPage = 100
  ): Promise<{
    branches: Array<{ name: string; protected: boolean; isDefault: boolean }>;
    defaultBranch: string;
    page: number;
    perPage: number;
  }> {
    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);
    const { page, perPage } = validatePagination(rawPage, rawPerPage, 100);

    const cacheKey = `branches:${organizationId}:${repository.id}:${page}:${perPage}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const res = await fetchFromGitHub(
      `/repos/${repository.fullName}/branches?page=${page}&per_page=${perPage}`,
      token
    );

    if (!res.ok) {
      handleGitHubResponseError(res, "branches");
    }

    const data = ((await res.json()) as any[]) || [];
    const defaultBranch = repository.defaultBranch || "main";

    const branches = data.map((b) => ({
      name: String(b.name),
      protected: Boolean(b.protected),
      isDefault: b.name === defaultBranch,
    }));

    const result = {
      branches,
      defaultBranch,
      page,
      perPage,
    };

    setCached(cacheKey, result, 30);
    return result;
  },

  /**
   * Tree / Directory browsing endpoint: GET /repositories/:repositoryId/tree
   */
  async getTree(
    organizationId: string,
    repositoryId: string,
    rawBranch?: string,
    rawPath?: string,
    rawPage = 1,
    rawPerPage = 100
  ): Promise<{
    branch: string;
    path: string;
    items: ITreeItem[];
    page: number;
    perPage: number;
    totalCount: number;
  }> {
    const normalizedPath = normalizeAndValidatePath(rawPath);
    const { page, perPage } = validatePagination(rawPage, rawPerPage, 200);
    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);
    const branch = validateBranch(rawBranch || repository.selectedBranch, repository.defaultBranch || "main");

    const cacheKey = `tree:${organizationId}:${repository.id}:${branch}:${normalizedPath}:${page}:${perPage}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const endpoint = normalizedPath
      ? `/repos/${repository.fullName}/contents/${encodeURIComponent(normalizedPath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`
      : `/repos/${repository.fullName}/contents?ref=${encodeURIComponent(branch)}`;

    const res = await fetchFromGitHub(endpoint, token);
    if (!res.ok) {
      handleGitHubResponseError(res, "directory");
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      // If a file was returned instead of a directory
      throw new GitHubExplorerError(
        `Requested path '${normalizedPath}' is a file, not a directory. Use the /file endpoint to read contents.`,
        400,
        "NOT_A_DIRECTORY"
      );
    }

    const mappedItems: ITreeItem[] = data.map((item: any) => {
      let type: "file" | "dir" | "symlink" | "submodule" = "file";
      if (item.type === "dir") type = "dir";
      else if (item.type === "symlink") type = "symlink";
      else if (item.type === "submodule") type = "submodule";

      return {
        name: item.name,
        path: item.path,
        type,
        size: item.size !== undefined ? Number(item.size) : undefined,
        sha: item.sha,
        downloadUrl: item.download_url || null,
        htmlUrl: item.html_url,
      };
    });

    // Sort: directories first, then alphabetical
    mappedItems.sort((a, b) => {
      if (a.type === "dir" && b.type !== "dir") return -1;
      if (a.type !== "dir" && b.type === "dir") return 1;
      return a.name.localeCompare(b.name);
    });

    // Apply pagination on directory contents
    const totalCount = mappedItems.length;
    const startIndex = (page - 1) * perPage;
    const paginatedItems = mappedItems.slice(startIndex, startIndex + perPage);

    const result = {
      branch,
      path: normalizedPath,
      items: paginatedItems,
      page,
      perPage,
      totalCount,
    };

    setCached(cacheKey, result, 30);
    return result;
  },

  /**
   * Source file reading endpoint: GET /repositories/:repositoryId/file
   */
  async getFile(
    organizationId: string,
    repositoryId: string,
    rawBranch?: string,
    rawPath?: string
  ): Promise<IFileResponse> {
    const normalizedPath = normalizeAndValidatePath(rawPath);
    if (!normalizedPath) {
      throw new GitHubExplorerError("File path is required.", 400, "MISSING_PATH");
    }

    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);
    const branch = validateBranch(rawBranch || repository.selectedBranch, repository.defaultBranch || "main");

    const filename = normalizedPath.split("/").pop() || normalizedPath;
    const maxFileSize = ENV.GITHUB_MAX_SOURCE_FILE_SIZE || 1024 * 1024; // 1 MB default

    const cacheKey = `file:${organizationId}:${repository.id}:${branch}:${normalizedPath}`;
    const cached = getCached<IFileResponse>(cacheKey);
    if (cached) return cached;

    // Fast-path: Check binary by extension before downloading payload
    if (isBinaryFilename(filename)) {
      // Still fetch metadata from GitHub to ensure file exists and get size/sha
      const endpoint = `/repos/${repository.fullName}/contents/${encodeURIComponent(normalizedPath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
      const res = await fetchFromGitHub(endpoint, token);
      if (!res.ok) {
        handleGitHubResponseError(res, "file");
      }
      const data: any = await res.json();
      const size = Number(data.size || 0);

      const binaryResult: IFileResponse = {
        type: "binary",
        name: filename,
        path: normalizedPath,
        size,
        sha: data.sha,
        content: null,
        mimeType: "application/octet-stream",
      };
      setCached(cacheKey, binaryResult, 60);
      return binaryResult;
    }

    const endpoint = `/repos/${repository.fullName}/contents/${encodeURIComponent(normalizedPath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
    const res = await fetchFromGitHub(endpoint, token);
    if (!res.ok) {
      handleGitHubResponseError(res, "file");
    }

    const data: any = await res.json();

    if (Array.isArray(data) || data.type === "dir") {
      throw new GitHubExplorerError(
        `Requested path '${normalizedPath}' is a directory, not a file. Use the /tree endpoint to view directories.`,
        400,
        "IS_A_DIRECTORY"
      );
    }

    const fileSize = Number(data.size || 0);

    // Enforce size limit
    if (fileSize > maxFileSize) {
      const tooLargeResult: IFileResponse = {
        type: "file_too_large",
        name: filename,
        path: normalizedPath,
        size: fileSize,
        maxSize: maxFileSize,
        language: detectLanguage(filename),
      };
      setCached(cacheKey, tooLargeResult, 60);
      return tooLargeResult;
    }

    // Decode GitHub content
    let decodedContent = "";
    if (data.content && data.encoding === "base64") {
      const buffer = Buffer.from(data.content.replace(/\n/g, ""), "base64");

      // Byte-level binary check
      if (isBinaryBuffer(buffer)) {
        const binaryResult: IFileResponse = {
          type: "binary",
          name: filename,
          path: normalizedPath,
          size: fileSize,
          sha: data.sha,
          content: null,
          mimeType: "application/octet-stream",
        };
        setCached(cacheKey, binaryResult, 60);
        return binaryResult;
      }

      decodedContent = buffer.toString("utf-8");
    } else if (data.content) {
      decodedContent = String(data.content);
    }

    const result: IFileResponse = {
      type: "file",
      name: filename,
      path: normalizedPath,
      size: fileSize,
      sha: data.sha,
      content: decodedContent,
      language: detectLanguage(filename),
      encoding: "utf-8",
    };

    setCached(cacheKey, result, 60);
    return result;
  },

  /**
   * Code search endpoint: GET /repositories/:repositoryId/search
   * Scoped strictly to repository: q + " repo:owner/name"
   */
  async searchCode(
    organizationId: string,
    repositoryId: string,
    rawQuery: string,
    rawBranch?: string,
    rawPage = 1,
    rawPerPage = 30
  ): Promise<{
    query: string;
    branch?: string;
    items: ICodeSearchItem[];
    totalCount: number;
    page: number;
    perPage: number;
  }> {
    const query = validateSearchQuery(rawQuery);
    const { page, perPage } = validatePagination(rawPage, rawPerPage, 100);
    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);
    const branch = rawBranch ? validateBranch(rawBranch, repository.defaultBranch) : undefined;

    const scopedQuery = `${query} repo:${repository.fullName}`;
    const cacheKey = `search:${organizationId}:${repository.id}:${query}:${page}:${perPage}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    const endpoint = `/search/code?q=${encodeURIComponent(scopedQuery)}&page=${page}&per_page=${perPage}`;
    const res = await fetchFromGitHub(endpoint, token, {
      Accept: "application/vnd.github.text-match+json",
    });

    if (!res.ok) {
      handleGitHubResponseError(res, "search results");
    }

    const data: any = await res.json();
    const rawItems = data.items || [];

    const items: ICodeSearchItem[] = rawItems.map((item: any) => {
      const matches = (item.text_matches || []).map((tm: any) => ({
        fragment: tm.fragment || "",
        indices: tm.matches?.[0]?.indices || [],
      }));

      return {
        name: item.name,
        path: item.path,
        sha: item.sha,
        htmlUrl: item.html_url,
        repository: repository.fullName,
        matches,
      };
    });

    const result = {
      query,
      branch,
      items,
      totalCount: Number(data.total_count || items.length),
      page,
      perPage,
    };

    setCached(cacheKey, result, 30);
    return result;
  },

  /**
   * Commit history endpoint: GET /repositories/:repositoryId/commits
   */
  async getCommits(
    organizationId: string,
    repositoryId: string,
    rawBranch?: string,
    rawPage = 1,
    rawPerPage = 30,
    rawPath?: string
  ): Promise<{
    branch: string;
    commits: ICommitItem[];
    page: number;
    perPage: number;
  }> {
    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);
    const branch = validateBranch(rawBranch || repository.selectedBranch, repository.defaultBranch || "main");
    const normalizedPath = rawPath ? normalizeAndValidatePath(rawPath) : "";
    const { page, perPage } = validatePagination(rawPage, rawPerPage, 100);

    const cacheKey = `commits:${organizationId}:${repository.id}:${branch}:${normalizedPath}:${page}:${perPage}`;
    const cached = getCached<any>(cacheKey);
    if (cached) return cached;

    let endpoint = `/repos/${repository.fullName}/commits?sha=${encodeURIComponent(branch)}&page=${page}&per_page=${perPage}`;
    if (normalizedPath) {
      endpoint += `&path=${encodeURIComponent(normalizedPath)}`;
    }

    const res = await fetchFromGitHub(endpoint, token);
    if (!res.ok) {
      handleGitHubResponseError(res, "commits");
    }

    const data = ((await res.json()) as any[]) || [];

    const commits: ICommitItem[] = data.map((c) => {
      const sha = String(c.sha || "");
      const commitObj = c.commit || {};
      const authorObj = commitObj.author || {};
      const committerObj = commitObj.committer || {};

      return {
        sha,
        shortSha: sha.slice(0, 7),
        message: String(commitObj.message || "").split("\n")[0],
        author: {
          name: authorObj.name || c.author?.login || "Unknown Author",
          email: authorObj.email || "",
          avatarUrl: c.author?.avatar_url || "",
          date: authorObj.date || new Date().toISOString(),
        },
        committer: {
          name: committerObj.name || c.committer?.login || "",
          email: committerObj.email || "",
          date: committerObj.date || "",
        },
        htmlUrl: c.html_url || `https://github.com/${repository.fullName}/commit/${sha}`,
        parents: (c.parents || []).map((p: any) => p.sha),
      };
    });

    const result = {
      branch,
      commits,
      page,
      perPage,
    };

    setCached(cacheKey, result, 30);
    return result;
  },

  /**
   * Commit details endpoint: GET /repositories/:repositoryId/commits/:sha
   */
  async getCommit(
    organizationId: string,
    repositoryId: string,
    rawSha: string
  ): Promise<ICommitDetail> {
    if (!rawSha || typeof rawSha !== "string") {
      throw new GitHubExplorerError("Commit SHA is required.", 400, "INVALID_SHA");
    }

    const sha = rawSha.trim();
    if (!/^[0-9a-fA-F]{7,40}$/.test(sha)) {
      throw new GitHubExplorerError("Invalid Git commit SHA format.", 400, "INVALID_SHA_FORMAT");
    }

    const { repository, token } = await this.verifyAndGetRepository(organizationId, repositoryId);

    const cacheKey = `commit_detail:${organizationId}:${repository.id}:${sha}`;
    const cached = getCached<ICommitDetail>(cacheKey);
    if (cached) return cached;

    const endpoint = `/repos/${repository.fullName}/commits/${sha}`;
    const res = await fetchFromGitHub(endpoint, token);
    if (!res.ok) {
      handleGitHubResponseError(res, "commit");
    }

    const data: any = await res.json();
    const commitObj = data.commit || {};
    const authorObj = commitObj.author || {};
    const statsObj = data.stats || {};
    const filesList = data.files || [];

    const result: ICommitDetail = {
      sha: data.sha || sha,
      shortSha: (data.sha || sha).slice(0, 7),
      message: String(commitObj.message || ""),
      author: {
        name: authorObj.name || data.author?.login || "Unknown Author",
        email: authorObj.email || "",
        avatarUrl: data.author?.avatar_url || "",
        date: authorObj.date || new Date().toISOString(),
      },
      htmlUrl: data.html_url || `https://github.com/${repository.fullName}/commit/${sha}`,
      parents: (data.parents || []).map((p: any) => p.sha),
      stats: {
        additions: Number(statsObj.additions || 0),
        deletions: Number(statsObj.deletions || 0),
        total: Number(statsObj.total || 0),
      },
      files: filesList.map((f: any) => ({
        filename: f.filename,
        status: f.status || "modified",
        additions: Number(f.additions || 0),
        deletions: Number(f.deletions || 0),
        changes: Number(f.changes || 0),
        patchSummary: f.patch ? f.patch.slice(0, 300) : undefined,
      })),
    };

    setCached(cacheKey, result, 120);
    return result;
  },
};
