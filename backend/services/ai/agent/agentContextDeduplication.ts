import crypto from "crypto";

export interface IRunContextDedupState {
  sentFilePaths: Set<string>;
  toolResultHashes: Set<string>;
  contentKeys: Set<string>;
}

const runStates = new Map<string, IRunContextDedupState>();

export function getRunDedupState(runId: string): IRunContextDedupState {
  let state = runStates.get(runId);
  if (!state) {
    state = {
      sentFilePaths: new Set(),
      toolResultHashes: new Set(),
      contentKeys: new Set(),
    };
    runStates.set(runId, state);
  }
  return state;
}

export function clearRunDedupState(runId: string): void {
  runStates.delete(runId);
}

export function shouldSkipFileContent(runId: string, path: string): boolean {
  return getRunDedupState(runId).sentFilePaths.has(path);
}

export function markFileContentSent(runId: string, path: string): void {
  getRunDedupState(runId).sentFilePaths.add(path);
}

export function shouldSkipToolResult(runId: string, toolName: string, payload: unknown): boolean {
  const hash = crypto
    .createHash("sha256")
    .update(toolName)
    .update(JSON.stringify(payload))
    .digest("hex");
  const state = getRunDedupState(runId);
  if (state.toolResultHashes.has(hash)) return true;
  state.toolResultHashes.add(hash);
  return false;
}

export function dedupeContentKey(runId: string, key: string): boolean {
  const state = getRunDedupState(runId);
  if (state.contentKeys.has(key)) return true;
  state.contentKeys.add(key);
  return false;
}

export function serializeDedupState(state: IRunContextDedupState): {
  sentFilePaths: string[];
  toolResultHashes: string[];
  contentKeys: string[];
} {
  return {
    sentFilePaths: Array.from(state.sentFilePaths).slice(-200),
    toolResultHashes: Array.from(state.toolResultHashes).slice(-200),
    contentKeys: Array.from(state.contentKeys).slice(-200),
  };
}

export function hydrateDedupState(
  runId: string,
  data?: {
    sentFilePaths?: string[];
    toolResultHashes?: string[];
    contentKeys?: string[];
  }
): void {
  if (!data) return;
  const state = getRunDedupState(runId);
  for (const p of data.sentFilePaths || []) state.sentFilePaths.add(p);
  for (const h of data.toolResultHashes || []) state.toolResultHashes.add(h);
  for (const k of data.contentKeys || []) state.contentKeys.add(k);
}
