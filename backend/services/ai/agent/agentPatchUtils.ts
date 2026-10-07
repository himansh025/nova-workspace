/**
 * Minimal unified-diff applier for single-file patches (patch-first editing).
 */
export function applyUnifiedPatch(original: string, patch: string): string {
  const patchBody = patch.trim();
  if (!patchBody) {
    throw new Error("Patch content is empty.");
  }

  // Simple search/replace patch format: <<<SEARCH ... ===REPLACE ... >>>END
  const blockMatch = patchBody.match(/<<<SEARCH\r?\n([\s\S]*?)\r?\n===\r?\n([\s\S]*?)\r?\n>>>/);
  if (blockMatch) {
    const search = blockMatch[1];
    const replace = blockMatch[2];
    if (!original.includes(search)) {
      throw new Error("Search block not found in file.");
    }
    return original.replace(search, replace);
  }

  const lines = original.split("\n");
  const patchLines = patchBody.split("\n");
  const result: string[] = [];
  let i = 0;
  let p = 0;

  while (p < patchLines.length) {
    const line = patchLines[p];
    if (line.startsWith("@@")) {
      p++;
      continue;
    }
    if (line.startsWith("---") || line.startsWith("+++")) {
      p++;
      continue;
    }
    if (line.startsWith("-")) {
      const content = line.slice(1);
      if (lines[i] !== content) {
        throw new Error(`Patch context mismatch at line ${i + 1}.`);
      }
      i++;
      p++;
      continue;
    }
    if (line.startsWith("+")) {
      result.push(line.slice(1));
      p++;
      continue;
    }
    if (line.startsWith(" ")) {
      result.push(lines[i] ?? "");
      i++;
      p++;
      continue;
    }
    // Context line without prefix — treat as literal match
    if (lines[i] === line) {
      result.push(lines[i]);
      i++;
      p++;
    } else {
      throw new Error("Unable to apply patch: context mismatch.");
    }
  }

  while (i < lines.length) {
    result.push(lines[i]);
    i++;
  }

  return result.join("\n");
}
