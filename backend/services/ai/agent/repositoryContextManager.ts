import { githubRepositoryExplorerService } from "../../githubRepositoryExplorerService";
import { repositoryContextService } from "../../repositoryContextService";
import { aiRepositoryContextBuilder } from "../aiRepositoryContextBuilder";
import { redactSecrets } from "../secretRedactor";
import { AGENT_CONFIG } from "./agentConfig";
import { validateAgentFilePath } from "./agentPathUtils";
import { agentContextCache } from "./agentContextCache";
import { extractTaskKeywords, rankRelevantFiles } from "./agentRelevanceService";
import { extractSymbolsFromSource, formatSymbolIndexForPrompt } from "./agentSymbolIndex";
import {
  dedupeContentKey,
  markFileContentSent,
  shouldSkipFileContent,
} from "./agentContextDeduplication";

export interface BoundedRepositoryContext {
  metadataBlock: string;
  structureBlock: string;
  codeContextBlock: string;
  symbolIndexBlock: string;
  relevantFiles: string[];
  discoveredFiles: string[];
  totalChars: number;
  strategy: "search-first";
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
    runId?: string;
  }): Promise<BoundedRepositoryContext> {
    const { organizationId, repositoryId, task, runId } = params;
    const { repository } = await githubRepositoryExplorerService.verifyAndGetRepository(
      organizationId,
      repositoryId
    );
    const branch = params.branch || repository.selectedBranch || repository.defaultBranch || "main";

    let metadataBlock = agentContextCache.getRepositoryMetadata(organizationId, repositoryId);
    if (!metadataBlock) {
      const meta = await githubRepositoryExplorerService.getRepositoryMetadata(
        organizationId,
        repositoryId
      );

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
        ).sanitized;
      } catch {
        overviewSnippet = "Overview unavailable.";
      }

      metadataBlock = redactSecrets(
        [
          `Name: ${meta.fullName}`,
          `Default branch: ${meta.defaultBranch}`,
          `Language: ${meta.language || "unknown"}`,
          `Private: ${meta.private}`,
          overviewSnippet,
        ].join("\n")
      ).sanitized;

      agentContextCache.setRepositoryMetadata(organizationId, repositoryId, metadataBlock);
    }

    let structureLines = agentContextCache.getFileTree(organizationId, repositoryId, branch);
    if (!structureLines) {
      const rootTree = await githubRepositoryExplorerService.getTree(
        organizationId,
        repositoryId,
        branch,
        "",
        1,
        60
      );
      structureLines = rootTree.items.map(
        (i) => `${i.type === "dir" ? "[dir]" : "[file]"} ${i.path}`
      );
      agentContextCache.setFileTree(organizationId, repositoryId, branch, structureLines);
    }

    const discoveredFiles = new Set<string>(params.seedFilePaths || []);
    const keywords = extractTaskKeywords(task, 5);

    for (const kw of keywords) {
      try {
        const search = await githubRepositoryExplorerService.searchCode(
          organizationId,
          repositoryId,
          kw,
          branch,
          1,
          8
        );
        for (const item of search.items) {
          discoveredFiles.add(item.path);
        }
      } catch {
        // rate limits — continue
      }
    }

    const planFiles: string[] = [];
    const relevantList = rankRelevantFiles({
      task,
      discovered: Array.from(discoveredFiles),
      planFiles,
      modified: [],
      limit: AGENT_CONFIG.maxFilesInContext,
    });

    let symbolIndex = agentContextCache.getSymbolIndex(organizationId, repositoryId, branch);
    if (!symbolIndex) {
      symbolIndex = {};
      for (const filePath of relevantList.slice(0, 6)) {
        try {
          const file = await githubRepositoryExplorerService.getFile(
            organizationId,
            repositoryId,
            branch,
            filePath
          );
          if (file.type === "file" && file.content) {
            symbolIndex[filePath] = extractSymbolsFromSource(filePath, file.content);
          }
        } catch {
          // skip
        }
      }
      agentContextCache.setSymbolIndex(organizationId, repositoryId, branch, symbolIndex);
    }

    const symbolIndexBlock = formatSymbolIndexForPrompt(symbolIndex);

    let codeContextBlock = "";
    const filesToLoad: string[] = [];
    for (const p of relevantList) {
      if (runId && shouldSkipFileContent(runId, p)) continue;
      const key = `file:${p}`;
      if (runId && dedupeContentKey(runId, key)) continue;
      filesToLoad.push(p);
    }

    if (filesToLoad.length > 0) {
      const built = await aiRepositoryContextBuilder.buildContext({
        organizationId,
        repositoryId,
        branch,
        filePaths: filesToLoad,
        includeOverview: false,
        maxTotalBytes: Math.min(AGENT_CONFIG.maxContextChars, 80 * 1024),
        maxFileBytes: 16 * 1024,
      });
      codeContextBlock = built.contextBlock;
      if (runId) {
        for (const p of filesToLoad) markFileContentSent(runId, p);
      }
    }

    const structureBlock = structureLines.join("\n").slice(0, 6000);
    const totalChars =
      metadataBlock.length +
      structureBlock.length +
      codeContextBlock.length +
      symbolIndexBlock.length;

    return {
      metadataBlock,
      structureBlock,
      codeContextBlock,
      symbolIndexBlock,
      relevantFiles: relevantList,
      discoveredFiles: Array.from(discoveredFiles),
      totalChars,
      strategy: "search-first",
    };
  }

  async enrichWithFilePaths(params: {
    organizationId: string;
    repositoryId: string;
    branch: string;
    filePaths: string[];
    existingContext: string;
    maxChars?: number;
    runId?: string;
  }): Promise<{ contextBlock: string; addedPaths: string[] }> {
    const maxChars = params.maxChars ?? AGENT_CONFIG.maxContextChars;
    const validPaths: string[] = [];
    for (const p of params.filePaths) {
      try {
        const path = validateAgentFilePath(p);
        if (params.runId && shouldSkipFileContent(params.runId, path)) continue;
        if (params.runId && dedupeContentKey(params.runId, `file:${path}`)) continue;
        validPaths.push(path);
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
      maxFileBytes: 16 * 1024,
    });

    if (params.runId) {
      for (const p of validPaths) markFileContentSent(params.runId, p);
    }

    const combined = `${params.existingContext}\n\n${built.contextBlock}`.slice(0, maxChars);
    return { contextBlock: combined, addedPaths: validPaths };
  }
}

export const repositoryContextManager = new RepositoryContextManager();
