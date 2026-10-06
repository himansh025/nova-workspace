import { githubRepositoryExplorerService, ITreeItem } from "./githubRepositoryExplorerService";
import { RepositoryModel } from "../models/Repository";

export interface IProjectDetection {
  projectType: string;
  confidence: number;
  evidence: string[];
  framework?: string;
  runtime?: string;
}

export interface IDependencySummary {
  manifestFound: string[];
  topDependencies: string[];
  devDependencies?: string[];
  totalDependenciesCount: number;
}

export interface IRepositoryOverview {
  repository: {
    id: string;
    fullName: string;
    owner: string;
    name: string;
    private: boolean;
    defaultBranch: string;
    selectedBranch: string;
  };
  branch: string;
  projectDetection: IProjectDetection;
  packageManager: {
    name: string;
    lockfile?: string;
  };
  dependencySummary: IDependencySummary;
  rootFiles: Array<{
    name: string;
    path: string;
    size?: number;
    category: "documentation" | "configuration" | "container" | "ci_cd" | "manifest" | "source";
  }>;
  rootDirectories: string[];
  languages: Record<string, number>;
  generatedAt: string;
}

export function detectProjectTypeFromFiles(filenames: string[]): IProjectDetection {
  const fileSet = new Set(filenames.map((f) => f.toLowerCase()));
  const evidence: string[] = [];

  // Next.js
  const nextConfigs = filenames.filter((f) => /^next\.config\.(js|mjs|ts|cjs)$/i.test(f));
  if (nextConfigs.length > 0) {
    evidence.push(...nextConfigs);
    if (fileSet.has("package.json")) evidence.push("package.json");
    return {
      projectType: "Next.js",
      framework: "Next.js",
      runtime: "Node.js",
      confidence: 1.0,
      evidence,
    };
  }

  // Vite
  const viteConfigs = filenames.filter((f) => /^vite\.config\.(js|mjs|ts|cjs)$/i.test(f));
  if (viteConfigs.length > 0) {
    evidence.push(...viteConfigs);
    if (fileSet.has("package.json")) evidence.push("package.json");
    return {
      projectType: "Vite",
      framework: "Vite",
      runtime: "Node.js",
      confidence: 1.0,
      evidence,
    };
  }

  // Nuxt
  const nuxtConfigs = filenames.filter((f) => /^nuxt\.config\.(js|mjs|ts|cjs)$/i.test(f));
  if (nuxtConfigs.length > 0) {
    evidence.push(...nuxtConfigs);
    return {
      projectType: "Nuxt",
      framework: "Nuxt",
      runtime: "Node.js",
      confidence: 1.0,
      evidence,
    };
  }

  // Remix
  const remixConfigs = filenames.filter((f) => /^remix\.config\.(js|mjs|ts|cjs)$/i.test(f));
  if (remixConfigs.length > 0) {
    evidence.push(...remixConfigs);
    return {
      projectType: "Remix",
      framework: "Remix",
      runtime: "Node.js",
      confidence: 1.0,
      evidence,
    };
  }

  // Svelte / SvelteKit
  const svelteConfigs = filenames.filter((f) => /^svelte\.config\.(js|mjs|ts|cjs)$/i.test(f));
  if (svelteConfigs.length > 0) {
    evidence.push(...svelteConfigs);
    return {
      projectType: "SvelteKit",
      framework: "SvelteKit",
      runtime: "Node.js",
      confidence: 1.0,
      evidence,
    };
  }

  // Rust
  if (fileSet.has("cargo.toml")) {
    evidence.push("Cargo.toml");
    if (fileSet.has("cargo.lock")) evidence.push("Cargo.lock");
    return {
      projectType: "Rust",
      runtime: "Rust",
      confidence: 1.0,
      evidence,
    };
  }

  // Go
  if (fileSet.has("go.mod")) {
    evidence.push("go.mod");
    if (fileSet.has("go.sum")) evidence.push("go.sum");
    return {
      projectType: "Go",
      runtime: "Go",
      confidence: 1.0,
      evidence,
    };
  }

  // Python
  const pythonEvidence: string[] = [];
  if (fileSet.has("pyproject.toml")) pythonEvidence.push("pyproject.toml");
  if (fileSet.has("requirements.txt")) pythonEvidence.push("requirements.txt");
  if (fileSet.has("setup.py")) pythonEvidence.push("setup.py");
  if (fileSet.has("pipfile")) pythonEvidence.push("Pipfile");
  if (fileSet.has("poetry.lock")) pythonEvidence.push("poetry.lock");

  if (pythonEvidence.length > 0) {
    return {
      projectType: "Python",
      runtime: "Python",
      confidence: 0.95,
      evidence: pythonEvidence,
    };
  }

  // Java / Maven
  if (fileSet.has("pom.xml")) {
    evidence.push("pom.xml");
    return {
      projectType: "Java (Maven)",
      framework: "Maven",
      runtime: "JVM",
      confidence: 1.0,
      evidence,
    };
  }

  // Java / Gradle
  if (fileSet.has("build.gradle") || fileSet.has("build.gradle.kts")) {
    const gradleFile = fileSet.has("build.gradle.kts") ? "build.gradle.kts" : "build.gradle";
    evidence.push(gradleFile);
    return {
      projectType: "Java / Kotlin (Gradle)",
      framework: "Gradle",
      runtime: "JVM",
      confidence: 1.0,
      evidence,
    };
  }

  // PHP
  if (fileSet.has("composer.json")) {
    evidence.push("composer.json");
    return {
      projectType: "PHP (Composer)",
      runtime: "PHP",
      confidence: 1.0,
      evidence,
    };
  }

  // Ruby
  if (fileSet.has("gemfile")) {
    evidence.push("Gemfile");
    return {
      projectType: "Ruby",
      runtime: "Ruby",
      confidence: 1.0,
      evidence,
    };
  }

  // Generic Node.js
  if (fileSet.has("package.json")) {
    evidence.push("package.json");
    if (fileSet.has("tsconfig.json")) evidence.push("tsconfig.json");
    return {
      projectType: "Node.js",
      runtime: "Node.js",
      confidence: 0.8,
      evidence,
    };
  }

  return {
    projectType: "Generic / Static Repository",
    confidence: 0.3,
    evidence: filenames.slice(0, 3),
  };
}

export function detectPackageManager(filenames: string[]): { name: string; lockfile?: string } {
  const fileSet = new Set(filenames.map((f) => f.toLowerCase()));

  if (fileSet.has("pnpm-lock.yaml")) {
    return { name: "pnpm", lockfile: "pnpm-lock.yaml" };
  }
  if (fileSet.has("yarn.lock")) {
    return { name: "yarn", lockfile: "yarn.lock" };
  }
  if (fileSet.has("package-lock.json")) {
    return { name: "npm", lockfile: "package-lock.json" };
  }
  if (fileSet.has("bun.lock") || fileSet.has("bun.lockb")) {
    return { name: "bun", lockfile: fileSet.has("bun.lockb") ? "bun.lockb" : "bun.lock" };
  }
  if (fileSet.has("cargo.lock")) {
    return { name: "cargo", lockfile: "Cargo.lock" };
  }
  if (fileSet.has("poetry.lock")) {
    return { name: "poetry", lockfile: "poetry.lock" };
  }
  if (fileSet.has("pipfile.lock")) {
    return { name: "pipenv", lockfile: "Pipfile.lock" };
  }
  if (fileSet.has("composer.lock")) {
    return { name: "composer", lockfile: "composer.lock" };
  }
  if (fileSet.has("go.sum")) {
    return { name: "go modules", lockfile: "go.sum" };
  }

  if (fileSet.has("package.json")) {
    return { name: "npm (inferred)" };
  }
  if (fileSet.has("cargo.toml")) {
    return { name: "cargo (inferred)" };
  }
  if (fileSet.has("requirements.txt") || fileSet.has("pyproject.toml")) {
    return { name: "pip (inferred)" };
  }

  return { name: "Unknown / Not specified" };
}

function categorizeRootFile(
  filename: string
): "documentation" | "configuration" | "container" | "ci_cd" | "manifest" | "source" {
  const lower = filename.toLowerCase();
  if (lower.startsWith("readme") || lower.startsWith("license") || lower.startsWith("contributing") || lower.startsWith("changelog")) {
    return "documentation";
  }
  if (lower.includes("docker") || lower.includes("containerfile") || lower.includes("compose")) {
    return "container";
  }
  if (lower.startsWith(".") && (lower.includes("env") || lower.includes("rc") || lower.includes("config"))) {
    return "configuration";
  }
  if (
    lower === "package.json" ||
    lower === "cargo.toml" ||
    lower === "go.mod" ||
    lower === "pyproject.toml" ||
    lower === "pom.xml" ||
    lower === "build.gradle" ||
    lower === "composer.json" ||
    lower === "gemfile" ||
    lower === "requirements.txt"
  ) {
    return "manifest";
  }
  if (lower.includes("config") || lower === "tsconfig.json" || lower === "makefile") {
    return "configuration";
  }
  return "source";
}

export const repositoryContextService = {
  /**
   * Builds structured repository overview / context deterministically without any AI invocation.
   */
  async getRepositoryOverview(
    organizationId: string,
    repositoryId: string,
    rawBranch?: string
  ): Promise<IRepositoryOverview> {
    const { repository } = await githubRepositoryExplorerService.verifyAndGetRepository(
      organizationId,
      repositoryId
    );

    const branch = rawBranch || repository.selectedBranch || repository.defaultBranch || "main";

    // 1. Fetch root directory items
    const rootTree = await githubRepositoryExplorerService.getTree(
      organizationId,
      repositoryId,
      branch,
      "",
      1,
      100
    );

    const rootFiles = rootTree.items
      .filter((item) => item.type === "file")
      .map((item) => ({
        name: item.name,
        path: item.path,
        size: item.size,
        category: categorizeRootFile(item.name),
      }));

    const rootDirectories = rootTree.items
      .filter((item) => item.type === "dir")
      .map((item) => item.name);

    const rootFileNames = rootTree.items.map((i) => i.name);

    // 2. Deterministic Project & Package Manager detection
    const projectDetection = detectProjectTypeFromFiles(rootFileNames);
    const packageManager = detectPackageManager(rootFileNames);

    // 3. Inspect known manifests safely (bounded read of small files)
    const dependencySummary: IDependencySummary = {
      manifestFound: [],
      topDependencies: [],
      devDependencies: [],
      totalDependenciesCount: 0,
    };

    if (rootFileNames.some((f) => f.toLowerCase() === "package.json")) {
      try {
        const pkgFile = await githubRepositoryExplorerService.getFile(
          organizationId,
          repositoryId,
          branch,
          "package.json"
        );
        if (pkgFile.content) {
          const parsed = JSON.parse(pkgFile.content);
          dependencySummary.manifestFound.push("package.json");

          const deps = Object.keys(parsed.dependencies || {});
          const devDeps = Object.keys(parsed.devDependencies || {});

          dependencySummary.topDependencies = deps.slice(0, 15);
          dependencySummary.devDependencies = devDeps.slice(0, 15);
          dependencySummary.totalDependenciesCount = deps.length + devDeps.length;
        }
      } catch {}
    } else if (rootFileNames.some((f) => f.toLowerCase() === "requirements.txt")) {
      try {
        const reqFile = await githubRepositoryExplorerService.getFile(
          organizationId,
          repositoryId,
          branch,
          "requirements.txt"
        );
        if (reqFile.content) {
          dependencySummary.manifestFound.push("requirements.txt");
          const lines = reqFile.content
            .split("\n")
            .map((l) => l.trim().split("==")[0].split(">=")[0].split("<=")[0].trim())
            .filter((l) => l.length > 0 && !l.startsWith("#"));

          dependencySummary.topDependencies = lines.slice(0, 15);
          dependencySummary.totalDependenciesCount = lines.length;
        }
      } catch {}
    } else if (rootFileNames.some((f) => f.toLowerCase() === "go.mod")) {
      try {
        const goModFile = await githubRepositoryExplorerService.getFile(
          organizationId,
          repositoryId,
          branch,
          "go.mod"
        );
        if (goModFile.content) {
          dependencySummary.manifestFound.push("go.mod");
          const requires = goModFile.content
            .split("\n")
            .map((l) => l.trim())
            .filter((l) => l.startsWith("require ") || (l.length > 0 && !l.startsWith("//") && !l.startsWith("module") && !l.startsWith("go ")));

          dependencySummary.topDependencies = requires.slice(0, 10);
          dependencySummary.totalDependenciesCount = requires.length;
        }
      } catch {}
    } else if (rootFileNames.some((f) => f.toLowerCase() === "cargo.toml")) {
      try {
        const cargoFile = await githubRepositoryExplorerService.getFile(
          organizationId,
          repositoryId,
          branch,
          "Cargo.toml"
        );
        if (cargoFile.content) {
          dependencySummary.manifestFound.push("Cargo.toml");
          const deps = cargoFile.content
            .split("\n")
            .filter((l) => l.includes("=") && !l.startsWith("["))
            .map((l) => l.split("=")[0].trim())
            .filter(Boolean);

          dependencySummary.topDependencies = deps.slice(0, 10);
          dependencySummary.totalDependenciesCount = deps.length;
        }
      } catch {}
    }

    return {
      repository: {
        id: repository.id,
        fullName: repository.fullName,
        owner: repository.owner,
        name: repository.name,
        private: repository.private,
        defaultBranch: repository.defaultBranch,
        selectedBranch: repository.selectedBranch || repository.defaultBranch,
      },
      branch,
      projectDetection,
      packageManager,
      dependencySummary,
      rootFiles,
      rootDirectories,
      languages: {},
      generatedAt: new Date().toISOString(),
    };
  },
};
