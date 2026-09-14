import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specId, taskId, language = "typescript", prompt } = body;

    const spec = specId ? db.getSpecById(specId) : null;
    const task = taskId ? db.getTaskById(taskId) : null;

    let codeSnippet = "";
    const title = spec?.title || task?.title || prompt || "CRDT State Sync Engine";

    if (spec?.key === "SPEC-104" || title.toLowerCase().includes("crdt")) {
      codeSnippet = `// NOVA Workspace Architecture Engine
// Spec: SPEC-104 (CRDT State Sync Protocol)
// Language: ${language.toUpperCase()}

import { VectorClock, CRDTMessage } from "@nova/crdt-core";

export class CRDTSyncEngine<T extends Record<string, unknown>> {
  private state: Map<string, { value: T[keyof T]; clock: VectorClock }>;
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.state = new Map();
  }

  /**
   * Applies delta mutation with sub-50ms deterministic clock ordering
   */
  public applyDelta(key: string, value: T[keyof T], incomingClock: VectorClock): boolean {
    const existing = this.state.get(key);

    if (!existing || incomingClock.isAfter(existing.clock)) {
      this.state.set(key, { value, clock: incomingClock });
      this.emitChange(key, value);
      return true; // Applied
    }

    return false; // Concurrency conflict resolved via Lamport ordering
  }

  private emitChange(key: string, value: unknown): void {
    console.log(\`[CRDT Sync \${this.nodeId}] Applied state delta for key "\${key}":\`, value);
  }
}`;
    } else if (spec?.key === "SPEC-105" || title.toLowerCase().includes("vector")) {
      codeSnippet = `// NOVA Workspace Architecture Engine
// Spec: SPEC-105 (Edge Vector Indexing)
// Language: ${language.toUpperCase()}

export interface VectorEmbedding {
  id: string;
  vector: number[];
  metadata: { commitSha: string; issueKey: string };
}

export class EdgeVectorSearchEngine {
  private dimensions: number = 1536;

  /**
   * Compute cosine similarity over quantized edge vectors
   */
  public searchNearest(queryVector: number[], embeddings: VectorEmbedding[], k = 5) {
    return embeddings
      .map((item) => ({
        item,
        similarity: this.cosineSimilarity(queryVector, item.vector)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  }
}`;
    } else {
      codeSnippet = `// NOVA Workspace AI Generated Code
// Target: ${title}
// Language: ${language.toUpperCase()}

export async function processNovaTelemetryEvent(eventBuffer: ArrayBuffer) {
  const view = new DataView(eventBuffer);
  const eventType = view.getUint16(0, true);
  const timestamp = view.getBigUint64(2, true);

  return {
    eventType,
    timestamp: Number(timestamp),
    processedAt: new Date().toISOString(),
    status: "ZERO_COPY_PARSED"
  };
}`;
    }

    return NextResponse.json({
      title,
      language,
      codeSnippet
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate code snippet" }, { status: 500 });
  }
}
