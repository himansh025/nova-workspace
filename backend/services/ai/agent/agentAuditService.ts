import crypto from "crypto";
import { AgentAuditLogModel } from "../../../models/AgentAuditLog";
import { redactSecrets } from "../secretRedactor";

function summarize(value: unknown, max = 500): string {
  const raw = typeof value === "string" ? value : JSON.stringify(value);
  return redactSecrets(raw).slice(0, max);
}

export const agentAuditService = {
  async record(params: {
    agentRunId: string;
    organizationId: string;
    userId: string;
    tool: string;
    path?: string;
    input: unknown;
    output: unknown;
  }) {
    await AgentAuditLogModel.create({
      id: `audit-${crypto.randomUUID()}`,
      agentRunId: params.agentRunId,
      organizationId: params.organizationId,
      userId: params.userId,
      tool: params.tool,
      path: params.path,
      inputSummary: summarize(params.input),
      outputSummary: summarize(params.output),
    });
  },

  async listForRun(agentRunId: string, organizationId: string, userId: string, limit = 100) {
    return AgentAuditLogModel.find({ agentRunId, organizationId, userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },
};
