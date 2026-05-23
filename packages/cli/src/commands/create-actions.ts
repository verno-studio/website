import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { generate, writeTree } from "@vernostudio/template-generator";
import type {
  AddonId,
  FrontendId,
  PackageId,
  PackageManager,
  ProjectConfig,
} from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../pm-exec";
import type { UltraciteInitMode } from "../pm-exec";
import { runProcess } from "../run";
import type { ResolvedCreateInputs, UiMode } from "./create-args";
import type { UltraciteLinterId } from "../ultracite-linter";
import { ensureAppGlobalsBaseLayerAtEnd } from "../app-globals";
import { readCliPackageVersion } from "../cli-version";
import { getShadcnWorkingDirectory } from "./create-plan";
import {
  VERNO_INITIAL_COMMIT_BODY,
  VERNO_INITIAL_COMMIT_SUBJECT,
  VERNO_MANIFEST_DIR,
} from "../constants";

export { ensureAppGlobalsBaseLayerAtEnd } from "../app-globals";

export interface VernoManifest {
  readonly addons: readonly AddonId[];
  readonly createdAt: string;
  readonly frontend: FrontendId;
  readonly generator: "verno";
  readonly generatorVersion: string;
  readonly packageManager: PackageManager;
  readonly packages: readonly PackageId[];
  readonly projectName: string;
  readonly shadcnPreset?: string;
  readonly studio: "Verno Studio";
  readonly ui: UiMode;
  readonly ultraciteLinter?: UltraciteLinterId;
}

export const buildVernoManifest = (args: {
  readonly resolved: ResolvedCreateInputs;
  readonly projectName: string;
}): VernoManifest => ({
  addons: args.resolved.addons,
  createdAt: new Date().toISOString(),
  frontend: args.resolved.frontend,
  generator: "verno",
  generatorVersion: readCliPackageVersion(),
  packageManager: args.resolved.packageManager,
  packages: args.resolved.packages,
  projectName: args.projectName,
  shadcnPreset: args.resolved.useShadcn ? args.resolved.shadcnPreset : undefined,
  studio: "Verno Studio",
  ui: args.resolved.ui,
  ultraciteLinter: args.resolved.runUltracite ? args.resolved.ultraciteLinter : undefined,
});

export const writeVernoManifest = async (
  projectDir: string,
  manifest: VernoManifest,
): Promise<void> => {
  const dir = join(projectDir, VERNO_MANIFEST_DIR);
  await mkdir(dir, { recursive: true });
  const out = join(dir, "manifest.json");
  await writeFile(out, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
};

export const getProjectPath = (name: string): string => resolve(process.cwd(), name);

export const assertPathAvailable = (projectDir: string): void => {
  if (existsSync(projectDir)) {
    throw new Error(`Path already exists: ${projectDir}`);
  }
};

export const scaffold = async (
  config: ProjectConfig,
  projectDir: string,
  onLine?: (line: string) => void,
): Promise<{ readonly filesWritten: number }> => {
  const hasTurborepo = config.addons.includes("turborepo");
  const hasUltracite = config.addons.includes("ultracite");
  let stackLabel = "next";
  if (hasTurborepo) {
    stackLabel = hasUltracite ? "monorepo+ultracite" : "monorepo";
  }
  onLine?.(`\nScaffolding (${stackLabel}) in ${projectDir} …`);
  const gen = generate({ config });
  const tree = gen.unwrap();
  const writeResult = await writeTree(tree, projectDir);
  const filesWritten = writeResult.unwrap();
  onLine?.(`Wrote ${String(filesWritten.length)} files.`);
  return { filesWritten: filesWritten.length };
};

export const runInstallIfEnabled = async (
  enabled: boolean,
  packageManager: PackageManager,
  projectDir: string,
): Promise<void> => {
  if (!enabled) {
    return;
  }
  const { args: installArgs, file } = getPmInstallCommand(packageManager);
  await runProcess(file, installArgs, { cwd: projectDir, stepId: "install" });
};

export const runShadcnIfEnabled = async (options: {
  readonly enabled: boolean;
  readonly packageManager: PackageManager;
  readonly preset: string;
  readonly projectDir: string;
  readonly monorepoWithDesignSystem: boolean;
}): Promise<void> => {
  if (!options.enabled) {
    return;
  }

  const workingDir = getShadcnWorkingDirectory(
    options.projectDir,
    options.monorepoWithDesignSystem,
  );

  // shadcn apply/add requires a detected framework (Next.js, Vite, etc.).
  // We write a temporary dummy config to ensure detection passes in all environments.
  const dummyConfigPath = join(workingDir, "vite.config.ts");
  await writeFile(dummyConfigPath, "export default {};\n", "utf-8");

  try {
    const bootstrap = getShadcnBootstrapCommand(options.packageManager, {
      monorepoWithDesignSystem: options.monorepoWithDesignSystem,
      preset: options.preset,
    });
    const addAll = getShadcnAddAllCommand(options.packageManager, {
      monorepoWithDesignSystem: options.monorepoWithDesignSystem,
    });

    for (const cmd of [bootstrap, addAll]) {
      await runProcess(cmd.file, cmd.args, {
        ciSafe: false,
        cwd: options.projectDir,
        stepId: "shadcn",
      });
    }
  } finally {
    await rm(dummyConfigPath, { force: true }).catch(() => {
      /* ignore cleanup errors */
    });
  }
};

export const runUltraciteIfEnabled = async (
  enabled: boolean,
  packageManager: PackageManager,
  projectDir: string,
  mode: UltraciteInitMode,
  runOptions?: { readonly ciSafe?: boolean; readonly linter?: UltraciteLinterId },
): Promise<void> => {
  if (!enabled) {
    return;
  }
  const u = getUltraciteInitCommand(packageManager, mode, { linter: runOptions?.linter });
  const ciSafe = runOptions?.ciSafe ?? mode === "quiet";
  await runProcess(u.file, u.args, { ciSafe, cwd: projectDir, stepId: "ultracite" });
};

export const runGitInitAndCommitIfEnabled = async (
  enabled: boolean,
  projectDir: string,
): Promise<void> => {
  if (!enabled) {
    return;
  }
  await runProcess("git", ["init"], { cwd: projectDir, stepId: "git" });
  await runProcess("git", ["add", "-A"], { cwd: projectDir, stepId: "git" });
  await runProcess(
    "git",
    ["commit", "-m", VERNO_INITIAL_COMMIT_SUBJECT, "-m", VERNO_INITIAL_COMMIT_BODY],
    { cwd: projectDir, stepId: "git" },
  );
};

export const toProjectConfig = (args: {
  readonly name: string;
  readonly npmScope: string;
  readonly packageManager: PackageManager;
  readonly shadcnPreset: string;
  readonly resolved: ResolvedCreateInputs;
}): ProjectConfig => ({
  addons: [...args.resolved.addons],
  frontend: args.resolved.frontend,
  npmScope: args.npmScope,
  packageManager: args.packageManager,
  packages: [...args.resolved.packages],
  projectName: args.name,
  shadcnPreset: args.shadcnPreset,
  ui: args.resolved.ui,
});
