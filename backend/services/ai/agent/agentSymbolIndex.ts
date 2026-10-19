/**
 * Lightweight symbol index (regex-based) for routing reads — not a full LSP.
 */
export function extractSymbolsFromSource(path: string, content: string): string[] {
  const symbols = new Set<string>();
  const lines = content.split("\n").slice(0, 500);

  for (const line of lines) {
    const trimmed = line.trim();
    let m: RegExpMatchArray | null;

    m = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)/);
    if (m) symbols.add(m[1]);

    m = trimmed.match(/^(?:export\s+)?class\s+([A-Za-z0-9_$]+)/);
    if (m) symbols.add(m[1]);

    m = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/);
    if (m) symbols.add(m[1]);

    m = trimmed.match(/^def\s+([A-Za-z0-9_]+)/);
    if (m) symbols.add(m[1]);

    m = trimmed.match(/^func\s+([A-Za-z0-9_]+)/);
    if (m) symbols.add(m[1]);
  }

  return Array.from(symbols).slice(0, 40);
}

export function formatSymbolIndexForPrompt(index: Record<string, string[]>, maxFiles = 15): string {
  const entries = Object.entries(index).slice(0, maxFiles);
  if (entries.length === 0) return "(no symbols indexed)";
  return entries
    .map(([path, syms]) => `${path}: ${syms.slice(0, 8).join(", ") || "(none)"}`)
    .join("\n");
}
