import fs from "fs/promises";
import path from "path";
import { detectPackageManager } from "../../repositoryContextService";
import { getWorkspaceDir } from "./agentWorkspaceService";

export type ExecutionKind = "test" | "build" | "lint";

export interface IAllowlistedCommand {
  packageManager: string;
  argv: string[];
  shellLine: string;
}

const NODE_MANAGERS = new Set(["npm", "pnpm", "yarn", "bun"]);

const COMMAND_TABLE: Record<ExecutionKind, Record<string, string[]>> = {
  test: {
    npm: ["npm", "test", "--if-present"],
    pnpm: ["pnpm", "test", "--if-present"],
    yarn: ["yarn", "test"],
    bun: ["bun", "test"],
  },
  build: {
    npm: ["npm", "run", "build", "--if-present"],
    pnpm: ["pnpm", "run", "build", "--if-present"],
    yarn: ["yarn", "build"],
    bun: ["bun", "run", "build"],
  },
  lint: {
    npm: ["npm", "run", "lint", "--if-present"],
    pnpm: ["pnpm", "run", "lint", "--if-present"],
    yarn: ["yarn", "lint"],
    bun: ["bun", "run", "lint"],
  },
};

export async function detectWorkspacePackageManager(runId: string): Promise<string> {
  const root = getWorkspaceDir(runId);
  let names: string[] = [];
  try {
    names = await fs.readdir(root);
  } catch {
    return "npm";
  }
  const detected = detectPackageManager(names);
  if (NODE_MANAGERS.has(detected.name)) {
    return detected.name;
  }
  if (names.includes("package.json")) {
    return "npm";
  }
  return detected.name;
}

export function buildAllowlistedCommand(
  packageManager: string,
  kind: ExecutionKind
): IAllowlistedCommand {
  const pm = NODE_MANAGERS.has(packageManager) ? packageManager : "npm";
  const argv = COMMAND_TABLE[kind][pm] || COMMAND_TABLE[kind].npm;
  return {
    packageManager: pm,
    argv,
    shellLine: argv.join(" "),
  };
}

export function assertCommandAllowlisted(argv: string[]): void {
  const joined = argv.join(" ");
  const allowedPatterns = [
    /^npm test/,
    /^npm run (build|lint)/,
    /^pnpm test/,
    /^pnpm run (build|lint)/,
    /^yarn (test|build|lint)/,
    /^bun (test|run build|run lint)/,
  ];
  if (!allowedPatterns.some((re) => re.test(joined))) {
    throw new Error("Command is not on the execution allowlist.");
  }
}

export async function workspaceHasPackageJson(runId: string): Promise<boolean> {
  try {
    await fs.access(path.join(getWorkspaceDir(runId), "package.json"));
    return true;
  } catch {
    return false;
  }
}
