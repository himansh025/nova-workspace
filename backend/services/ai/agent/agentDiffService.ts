export interface IFileDiff {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  linesAdded: number;
  linesRemoved: number;
  unifiedDiff: string;
}

export interface IDiffSummary {
  filesAdded: number;
  filesModified: number;
  filesDeleted: number;
  linesAdded: number;
  linesRemoved: number;
  fileDiffs: IFileDiff[];
}

export function computeLineChangeStats(before: string, after: string): {
  linesAdded: number;
  linesRemoved: number;
} {
  const b = before.split("\n");
  const a = after.split("\n");
  let linesAdded = 0;
  let linesRemoved = 0;
  const maxLen = Math.max(b.length, a.length);
  for (let i = 0; i < maxLen; i++) {
    const oldL = b[i];
    const newL = a[i];
    if (oldL === undefined && newL !== undefined) linesAdded++;
    else if (oldL !== undefined && newL === undefined) linesRemoved++;
    else if (oldL !== newL) {
      linesAdded++;
      linesRemoved++;
    }
  }
  return { linesAdded, linesRemoved };
}

export function buildUnifiedDiff(path: string, before: string, after: string): string {
  const bLines = before.split("\n");
  const aLines = after.split("\n");
  const header = `--- a/${path}\n+++ b/${path}\n`;
  if (before === after) return header + "@@ no changes @@\n";

  const max = Math.max(bLines.length, aLines.length);
  const hunks: string[] = [];
  for (let i = 0; i < max; i++) {
    const oldL = bLines[i];
    const newL = aLines[i];
    if (oldL === newL) continue;
    if (oldL !== undefined) hunks.push(`-${oldL}`);
    if (newL !== undefined) hunks.push(`+${newL}`);
  }
  return `${header}@@\n${hunks.slice(0, 200).join("\n")}`;
}

export function computeFileDiff(
  path: string,
  before: string,
  after: string
): { summary: IDiffSummary; fileDiff: IFileDiff } {
  const stats = computeLineChangeStats(before, after);
  let status: IFileDiff["status"] = "modified";
  if (!before && after) status = "added";
  if (before && !after) status = "deleted";

  const fileDiff: IFileDiff = {
    path,
    status,
    linesAdded: stats.linesAdded,
    linesRemoved: stats.linesRemoved,
    unifiedDiff: buildUnifiedDiff(path, before, after).slice(0, 8000),
  };

  const summary: IDiffSummary = {
    filesAdded: status === "added" ? 1 : 0,
    filesModified: status === "modified" ? 1 : 0,
    filesDeleted: status === "deleted" ? 1 : 0,
    linesAdded: stats.linesAdded,
    linesRemoved: stats.linesRemoved,
    fileDiffs: [fileDiff],
  };

  return { summary, fileDiff };
}

export function mergeDiffSummary(a: IDiffSummary, b: IDiffSummary): IDiffSummary {
  return {
    filesAdded: a.filesAdded + b.filesAdded,
    filesModified: a.filesModified + b.filesModified,
    filesDeleted: a.filesDeleted + b.filesDeleted,
    linesAdded: a.linesAdded + b.linesAdded,
    linesRemoved: a.linesRemoved + b.linesRemoved,
    fileDiffs: [...a.fileDiffs, ...b.fileDiffs].slice(-50),
  };
}
