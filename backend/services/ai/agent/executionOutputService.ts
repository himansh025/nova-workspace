import { AGENT_CONFIG } from "./agentConfig";

export interface IRawExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface IExecutionSummary {
  exitCode: number;
  success: boolean;
  durationMs: number;
  stdoutPreview: string;
  stderrPreview: string;
  errorSummary: string;
  stackTraceExcerpt: string;
  truncated: boolean;
}

export function truncateOutput(text: string, max = AGENT_CONFIG.sandboxMaxOutputChars): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n…[truncated ${text.length - max} chars]`;
}

export function summarizeExecutionOutput(raw: IRawExecutionOutput): IExecutionSummary {
  const stdout = truncateOutput(raw.stdout || "");
  const stderr = truncateOutput(raw.stderr || "");
  const combined = `${raw.stderr}\n${raw.stdout}`;
  const truncated =
    (raw.stdout?.length || 0) > AGENT_CONFIG.sandboxMaxOutputChars ||
    (raw.stderr?.length || 0) > AGENT_CONFIG.sandboxMaxOutputChars;

  const errorLines = combined
    .split("\n")
    .filter((line) =>
      /error|fail|exception|assert/i.test(line) || /^\s*at\s+/i.test(line)
    )
    .slice(-40);

  const stackTraceExcerpt = combined
    .split("\n")
    .filter((line) => /^\s*at\s+/.test(line) || /Error:/.test(line))
    .slice(-20)
    .join("\n");

  const errorSummary = errorLines.slice(-12).join("\n") || (raw.exitCode !== 0 ? "Command failed." : "");

  return {
    exitCode: raw.exitCode,
    success: raw.exitCode === 0,
    durationMs: raw.durationMs,
    stdoutPreview: stdout.slice(0, 4000),
    stderrPreview: stderr.slice(0, 4000),
    errorSummary: truncateOutput(errorSummary, 2000),
    stackTraceExcerpt: truncateOutput(stackTraceExcerpt, 1500),
    truncated,
  };
}

export function buildCompactFailureContext(params: {
  planStep?: string;
  modifiedFiles: string[];
  diffSummary?: string;
  execution: IExecutionSummary;
}): string {
  return JSON.stringify(
    {
      planStep: params.planStep,
      changedFiles: params.modifiedFiles.slice(0, 10),
      diffSummary: params.diffSummary,
      exitCode: params.execution.exitCode,
      errorSummary: params.execution.errorSummary,
      stackTraceExcerpt: params.execution.stackTraceExcerpt,
    },
    null,
    0
  );
}
