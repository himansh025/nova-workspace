export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
  };
  branch: string;
  targetBranch: string;
  status: "open" | "merged" | "draft";
  commitsCount: number;
  filesChangedCount: number;
  additions: number;
  deletions: number;
  createdAt: string;
  linkedIssueKey?: string;
  diff: {
    filename: string;
    oldPath: string;
    newPath: string;
    chunks: {
      header: string;
      lines: {
        type: "add" | "del" | "normal";
        oldLine?: number;
        newLine?: number;
        content: string;
      }[];
    }[];
  }[];
  aiReview?: {
    score: number;
    securityStatus: "PASSED" | "WARNING" | "CRITICAL";
    performanceImpact: string;
    summary: string;
    findings: {
      id: string;
      type: "security" | "performance" | "suggestion";
      filename: string;
      lineNumber: number;
      title: string;
      message: string;
      suggestion?: string;
    }[];
  };
}

export const INITIAL_PULL_REQUESTS: PullRequest[] = [
  {
    id: "pr-1",
    number: 142,
    title: "feat(crdt): Implement zero-copy buffer compaction in sync engine",
    description: "Replaces standard JSON serialization with zero-copy binary ArrayBuffers to reduce garbage collection spikes and keep 99th percentile sync latency under 12ms during high throughput bursts.",
    author: {
      name: "Elena Rostova",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      initials: "ER",
    },
    branch: "feat/binary-parser",
    targetBranch: "main",
    status: "open",
    commitsCount: 3,
    filesChangedCount: 2,
    additions: 48,
    deletions: 14,
    createdAt: "2 hours ago",
    linkedIssueKey: "NV-842",
    diff: [
      {
        filename: "src/engine/sync/binaryParser.ts",
        oldPath: "a/src/engine/sync/binaryParser.ts",
        newPath: "b/src/engine/sync/binaryParser.ts",
        chunks: [
          {
            header: "@@ -18,14 +18,48 @@ export class StateSynchronizer {",
            lines: [
              { type: "normal", oldLine: 18, newLine: 18, content: "  private stateVersion: number = 0;" },
              { type: "normal", oldLine: 19, newLine: 19, content: "  private bufferPool: ArrayBuffer[] = [];" },
              { type: "del", oldLine: 20, content: "-  public parseIncomingPayload(rawString: string): SyncDelta {" },
              { type: "del", oldLine: 21, content: "-    const parsed = JSON.parse(rawString);" },
              { type: "del", oldLine: 22, content: "-    return this.reconcileState(parsed);" },
              { type: "del", oldLine: 23, content: "-  }" },
              { type: "add", newLine: 20, content: "+  public parseIncomingBuffer(rawView: DataView): SyncDelta {" },
              { type: "add", newLine: 21, content: "+    // Fast-path zero copy binary decode" },
              { type: "add", newLine: 22, content: "+    const magic = rawView.getUint32(0, true);" },
              { type: "add", newLine: 23, content: "+    if (magic !== 0x4e4f5641) { // 'NOVA'" },
              { type: "add", newLine: 24, content: "+      throw new Error('Invalid binary magic header: 0x' + magic.toString(16));" },
              { type: "add", newLine: 25, content: "+    }" },
              { type: "add", newLine: 26, content: "+    const seqId = rawView.getBigUint64(4, true);" },
              { type: "add", newLine: 27, content: "+    const payloadLen = rawView.getUint32(12, true);" },
              { type: "add", newLine: 28, content: "+    const deltaSlice = new Uint8Array(rawView.buffer, 16, payloadLen);" },
              { type: "add", newLine: 29, content: "+    return this.reconcileStateBinary(seqId, deltaSlice);" },
              { type: "add", newLine: 30, content: "+  }" },
              { type: "normal", oldLine: 24, newLine: 31, content: "  private reconcileStateBinary(seq: bigint, delta: Uint8Array): SyncDelta {" },
              { type: "normal", oldLine: 25, newLine: 32, content: "    this.stateVersion += 1;" },
              { type: "normal", oldLine: 26, newLine: 33, content: "    return { version: this.stateVersion, timestamp: Date.now() };" },
            ],
          },
        ],
      },
    ],
    aiReview: {
      score: 94,
      securityStatus: "PASSED",
      performanceImpact: "Estimated 62% reduction in memory allocation overhead",
      summary: "High quality optimization. Replaces costly JSON parse step with memory-aligned DataView operations. Correctly verifies header magic byte.",
      findings: [
        {
          id: "find-1",
          type: "performance",
          filename: "src/engine/sync/binaryParser.ts",
          lineNumber: 28,
          title: "Verify Buffer Alignment Boundary",
          message: "DataView.buffer offset (16) is aligned to 4-byte boundaries, which ensures zero hardware fault on SIMD architectures.",
          suggestion: "// Consider asserting rawView.byteLength >= 16 + payloadLen to prevent boundary overrun.",
        },
      ],
    },
  },
  {
    id: "pr-2",
    number: 145,
    title: "fix(auth): Prevent cross-tenant token replay in JWT verifier",
    description: "Enforces tenant organization claim checking during cryptographic token validation to eliminate hypothetical cross-tenant permission escalation.",
    author: {
      name: "Aaliyah Patel",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
      initials: "AP",
    },
    branch: "sec/jwt-isolation",
    targetBranch: "main",
    status: "open",
    commitsCount: 2,
    filesChangedCount: 1,
    additions: 22,
    deletions: 5,
    createdAt: "5 hours ago",
    linkedIssueKey: "NV-873",
    diff: [
      {
        filename: "src/server/auth/verifier.ts",
        oldPath: "a/src/server/auth/verifier.ts",
        newPath: "b/src/server/auth/verifier.ts",
        chunks: [
          {
            header: "@@ -34,5 +34,22 @@ export async function verifyAuthToken(token: string) {",
            lines: [
              { type: "normal", oldLine: 34, newLine: 34, content: "  const decoded = await verifySignature(token);" },
              { type: "del", oldLine: 35, content: "-  return { user: decoded.sub, valid: true };" },
              { type: "add", newLine: 35, content: "+  if (!decoded.tenantId || typeof decoded.tenantId !== 'string') {" },
              { type: "add", newLine: 36, content: "+    throw new SecurityException('Missing mandatory tenant claim in token');" },
              { type: "add", newLine: 37, content: "+  }" },
              { type: "add", newLine: 38, content: "+  // Bind cryptographic tenant isolation scope" },
              { type: "add", newLine: 39, content: "+  return { user: decoded.sub, tenantId: decoded.tenantId, valid: true };" },
            ],
          },
        ],
      },
    ],
    aiReview: {
      score: 98,
      securityStatus: "PASSED",
      performanceImpact: "Negligible (<0.1ms overhead)",
      summary: "Critical security patch verifying tenant claims at validation boundaries.",
      findings: [
        {
          id: "find-2",
          type: "security",
          filename: "src/server/auth/verifier.ts",
          lineNumber: 36,
          title: "Tenant Validation Check",
          message: "Cleanly isolates multi-tenant context before downstream request dispatching.",
        },
      ],
    },
  },
  {
    id: "pr-3",
    number: 149,
    title: "infra(edge): Standardize request trace headers across V8 runtime delegates",
    description: "Propagates x-nova-trace-id and x-nova-cluster-region across all micro-frontend edge delegates.",
    author: {
      name: "Marcus Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
      initials: "MC",
    },
    branch: "infra/edge-headers",
    targetBranch: "main",
    status: "open",
    commitsCount: 1,
    filesChangedCount: 1,
    additions: 15,
    deletions: 2,
    createdAt: "1 day ago",
    linkedIssueKey: "NV-851",
    diff: [
      {
        filename: "src/middleware/edgeHeaders.ts",
        oldPath: "a/src/middleware/edgeHeaders.ts",
        newPath: "b/src/middleware/edgeHeaders.ts",
        chunks: [
          {
            header: "@@ -12,2 +12,15 @@ export function injectEdgeContext(req: Request) {",
            lines: [
              { type: "normal", oldLine: 12, newLine: 12, content: "  const headers = new Headers(req.headers);" },
              { type: "add", newLine: 13, content: "+  headers.set('x-nova-trace-id', crypto.randomUUID());" },
              { type: "add", newLine: 14, content: "+  headers.set('x-nova-edge-region', process.env.EDGE_REGION || 'iad-01');" },
              { type: "normal", oldLine: 13, newLine: 15, content: "  return headers;" },
            ],
          },
        ],
      },
    ],
  },
];
