import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import { AGENT_CONFIG } from "./agentConfig";
import {
  assertCommandAllowlisted,
  buildAllowlistedCommand,
  detectWorkspacePackageManager,
  workspaceHasPackageJson,
  type ExecutionKind,
} from "./executionPolicyService";
import {
  summarizeExecutionOutput,
  type IExecutionSummary,
  type IRawExecutionOutput,
} from "./executionOutputService";
import { getWorkspaceDir } from "./agentWorkspaceService";

export interface ISandboxRunResult extends IExecutionSummary {
  tool: string;
  command: string;
  packageManager: string;
  sandbox: "docker" | "mock";
}

async function isDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("docker", ["version", "--format", "{{.Server.Version}}"], {
      stdio: "ignore",
    });
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

async function readMockConfig(workspace: string): Promise<{ exitCode?: number; stdout?: string; stderr?: string; delayMs?: number } | null> {
  try {
    const raw = await fs.readFile(path.join(workspace, ".nova-sandbox-mock.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function runMockSandbox(
  workspace: string,
  commandLine: string,
  kind: ExecutionKind
): Promise<IRawExecutionOutput> {
  const started = Date.now();
  const mock = await readMockConfig(workspace);
  if (mock?.delayMs) {
    await new Promise((r) => setTimeout(r, Math.min(mock.delayMs, 5000)));
  }
  if (mock) {
    return {
      exitCode: mock.exitCode ?? 0,
      stdout: mock.stdout ?? `[mock] ${kind} ok\n`,
      stderr: mock.stderr ?? "",
      durationMs: Date.now() - started,
    };
  }
  return {
    exitCode: 0,
    stdout: `[mock sandbox] ${commandLine}\n`,
    stderr: "",
    durationMs: Date.now() - started,
  };
}

async function runDockerSandbox(
  workspace: string,
  argv: string[]
): Promise<IRawExecutionOutput> {
  const started = Date.now();
  assertCommandAllowlisted(argv);

  const shellCmd = argv.map((a) => `'${a.replace(/'/g, `'\\''`)}'`).join(" ");
  const dockerArgs = [
    "run",
    "--rm",
    `--network=${AGENT_CONFIG.sandboxNetwork}`,
    `--memory=${AGENT_CONFIG.sandboxMemory}`,
    `--cpus=${AGENT_CONFIG.sandboxCpus}`,
    `--pids-limit=${AGENT_CONFIG.sandboxPidsLimit}`,
    "--user",
    AGENT_CONFIG.sandboxUser,
    "--tmpfs",
    `/tmp:rw,noexec,nosuid,size=${AGENT_CONFIG.sandboxTmpfsMb}m`,
    "-v",
    `${workspace}:/workspace:rw`,
    "-w",
    "/workspace",
    AGENT_CONFIG.sandboxImage,
    "sh",
    "-c",
    shellCmd,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn("docker", dockerArgs, {
      stdio: ["ignore", "pipe", "pipe"],
      env: {},
    });

    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > AGENT_CONFIG.sandboxMaxOutputChars * 2) {
        stdout = stdout.slice(0, AGENT_CONFIG.sandboxMaxOutputChars * 2);
      }
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
      if (stderr.length > AGENT_CONFIG.sandboxMaxOutputChars * 2) {
        stderr = stderr.slice(0, AGENT_CONFIG.sandboxMaxOutputChars * 2);
      }
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error(`Sandbox execution timed out after ${AGENT_CONFIG.sandboxTimeoutMs}ms.`));
    }, AGENT_CONFIG.sandboxTimeoutMs);

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - started,
      });
    });
  });
}

export const sandboxExecutorService = {
  async runAllowlisted(runId: string, kind: ExecutionKind, toolName: string): Promise<ISandboxRunResult> {
    const workspace = getWorkspaceDir(runId);
    const hasPkg = await workspaceHasPackageJson(runId);
    if (!hasPkg) {
      const summary = summarizeExecutionOutput({
        exitCode: 1,
        stdout: "",
        stderr: "No package.json in workspace — cannot run Node package scripts.",
        durationMs: 0,
      });
      return {
        ...summary,
        tool: toolName,
        command: "",
        packageManager: "unknown",
        sandbox: "mock",
      };
    }

    const pm = await detectWorkspacePackageManager(runId);
    const { argv, shellLine, packageManager } = buildAllowlistedCommand(pm, kind);

    const mode = AGENT_CONFIG.sandboxMode;
    let raw: IRawExecutionOutput;
    let sandbox: "docker" | "mock" = "mock";

    if (mode === "docker" && (await isDockerAvailable())) {
      sandbox = "docker";
      raw = await runDockerSandbox(workspace, argv);
    } else if (mode === "docker" && !(await isDockerAvailable())) {
      throw new Error(
        "Docker sandbox is required but unavailable. Set AGENT_SANDBOX_MODE=mock for local development."
      );
    } else {
      raw = await runMockSandbox(workspace, shellLine, kind);
    }

    const summary = summarizeExecutionOutput(raw);
    return {
      ...summary,
      tool: toolName,
      command: shellLine,
      packageManager,
      sandbox,
    };
  },
};
