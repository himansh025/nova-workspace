import { ENV } from "../../../config/env";

export const AGENT_CONFIG = {
  maxIterations: Number(process.env.MAX_AGENT_ITERATIONS || 12),
  maxContextChars: Number(process.env.AGENT_MAX_CONTEXT_CHARS || 80_000),
  maxToolOutputChars: Number(process.env.AGENT_MAX_TOOL_OUTPUT_CHARS || 12_000),
  maxReadFileLines: Number(process.env.AGENT_MAX_READ_FILE_LINES || 400),
  maxFilesInContext: Number(process.env.AGENT_MAX_FILES_IN_CONTEXT || 12),
  runTimeoutMs: Number(process.env.AGENT_RUN_TIMEOUT_MS || 120_000),
  planningMaxOutputTokens: Number(process.env.AGENT_PLANNING_MAX_TOKENS || 4096),
  decisionMaxOutputTokens: Number(process.env.AGENT_DECISION_MAX_TOKENS || 2048),
  finalMaxOutputTokens: Number(process.env.AGENT_FINAL_MAX_TOKENS || 4096),
  githubMaxFileSize: ENV.GITHUB_MAX_SOURCE_FILE_SIZE,
};
