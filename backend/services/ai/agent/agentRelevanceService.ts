const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "into",
  "fix",
  "add",
  "update",
]);

export function extractTaskKeywords(task: string, limit = 6): string[] {
  return task
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9_-]/g, ""))
    .filter((w) => w.length > 3 && !STOP.has(w))
    .slice(0, limit);
}

export function rankRelevantFiles(params: {
  task: string;
  discovered: string[];
  planFiles: string[];
  modified: string[];
  limit: number;
}): string[] {
  const keywords = extractTaskKeywords(params.task);
  const scores = new Map<string, number>();

  const bump = (path: string, weight: number) => {
    const key = path.toLowerCase();
    scores.set(key, (scores.get(key) || 0) + weight);
  };

  for (const p of params.modified) bump(p, 100);
  for (const p of params.planFiles) bump(p, 50);
  for (const p of params.discovered) bump(p, 10);

  for (const [path] of scores) {
    for (const kw of keywords) {
      if (path.includes(kw)) {
        bump(path, 25);
      }
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([path]) => path)
    .slice(0, params.limit);
}
