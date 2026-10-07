import { githubRepositoryExplorerService } from "../../githubRepositoryExplorerService";
import { repositoryContextService } from "../../repositoryContextService";
import { aiRepositoryContextBuilder } from "../aiRepositoryContextBuilder";
import { redactSecrets } from "../secretRedactor";
import { AGENT_CONFIG } from "./agentConfig";
import { validateAgentFilePath } from "./agentPathUtils";

export interface BoundedRepositoryContext {
  metadataBlock: string;
  structureBlock: string;
  codeContextBlock: string;
  relevantFiles: string[];
  discoveredFiles: string[];
  totalChars: number;
}

/**
 * Builds bounded repository context — never loads the entire repository into the model prompt.
 */
export class RepositoryContextManager {
  async buildInitialContext(params: {
    organizationId: string;
    repositoryId: string;
    branch?: string;
    task: string;
    seedFilePaths?: string[];
  }): Promise<BoundedRepositoryContext> {
    const { organizationId, repositoryId, task } = params;
    const { repository } = await githubRepositoryExplorerService.verifyAndGetRepository(
      organizationId,
      repositoryId
    );
    const branch = params.branch || repository.selectedBranch || repository.defaultBranch || "main";

    const meta = await githubRepositoryExplorerService.getRepositoryMetadata(
      organizationId,
      repositoryId
    );

    const rootTree = await githubRepositoryExplorerService.getTree(
      organizationId,
      repositoryId,
      branch,
      "",
      1,
      80
    );

    const discoveredFiles = new Set<string>(params.seedFilePaths || []);
    const structureLines = rootTree.items.map(
      (i) => `${i.type === "dir" ? "[dir]" : "[file]"} ${i.path}`
    );

    // Task-keyword search (bounded)
    const keywords = task
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9_-]/g, ""))
      .filter((w) => w.length > 3)
      .slice(0, 3);

    for (const kw of keywords) {
      try {
        const search = await githubRepositoryExplorerService.searchCode(
          organizationId,
          repositoryId,
          kw,
          branch,
          1,
          10
        );
        for (const item of search.items) {
          discoveredFiles.add(item.path);
        }
      } catch {
        // search may fail on rate limits — continue with tree only
      }
    }

    const relevantList = Array.from(discoveredFiles).slice(0, AGENT_CONFIG.maxFilesInContext);

    let codeContextBlock = "";
    if (relevantList.length > 0) {
      const built = await aiRepositoryContextBuilder.buildContext({
        organizationId,
        repositoryId,
        branch,
        filePaths: relevantList,
        includeOverview: false,
        maxTotalBytes: Math.min(AGENT_CONFIG.maxContextChars, 100 * 1024),
        maxFileBytes: 20 * 1024,
      });
      codeContextBlock = built.contextBlock;
    }

    let overviewSnippet = "";
    try {
      const overview = await repositoryContextService.getRepositoryOverview(
        organizationId,
        repositoryId,
        branch
      );
      const topLang = Object.entries(overview.languages || {})
        .sort((a, b) => b[1] - a[1])
        .map(([lang]) => lang)[0];
      overviewSnippet = redactSecrets(
        `Project: ${overview.projectDetection.projectType}\nPrimary language: ${topLang || "unknown"}`
      );
    } catch {
      overviewSnippet = "Overview unavailable.";
    }

    const metadataBlock = redactSecrets(
      [
        `Name: ${meta.fullName}`,
        `Default branch: ${meta.defaultBranch}`,
        `Language: ${meta.language || "unknown"}`,
        `Private: ${meta.private}`,
        overviewSnippet,
      ].join("\n")
    );

    const structureBlock = structureLines.join("\n").slice(0, 8000);
    const totalChars =
      metadataBlock.length + structureBlock.length + codeContextBlock.length;

    return {
      metadataBlock,
      structureBlock,
      codeContextBlock,
      relevantFiles: relevantList,
      discoveredFiles: Array.from(discoveredFiles),
      totalChars,
    };
  }

  async enrichWithFilePaths(params: {
    organizationId: string;
    repositoryId: string;
    branch: string;
    filePaths: string[];
    existingContext: string;
    maxChars?: number;
  }): Promise<{ contextBlock: string; addedPaths: string[] }> {
    const maxChars = params.maxChars ?? AGENT_CONFIG.maxContextChars;
    const validPaths: string[] = [];
    for (const p of params.filePaths) {
      try {
        validPaths.push(validateAgentFilePath(p));
      } catch {
        // skip invalid
      }
    }

    if (validPaths.length === 0) {
      return { contextBlock: params.existingContext, addedPaths: [] };
    }

    const built = await aiRepositoryContextBuilder.buildContext({
      organizationId: params.organizationId,
      repositoryId: params.repositoryId,
      branch: params.branch,
      filePaths: validPaths.slice(0, AGENT_CONFIG.maxFilesInContext),
      includeOverview: false,
      maxTotalBytes: maxChars - params.existingContext.length,
      maxFileBytes: 20 * 1024,
    });

    const combined = `${params.existingContext}\n\n${built.contextBlock}`.slice(0, maxChars);
    return { contextBlock: combined, addedPaths: validPaths };
  }
}

export const repositoryContextManager = new RepositoryContextManager();
