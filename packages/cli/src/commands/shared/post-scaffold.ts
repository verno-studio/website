import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PackageManager } from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../../pm-exec";
import type { UltraciteInitMode } from "../../pm-exec";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { runProcess } from "../../run";

export const getShadcnWorkingDirectory = (
  projectDir: string,
  monorepoWithDesignSystem: boolean,
): string =>
  monorepoWithDesignSystem ? join(projectDir, "packages", "design-system") : projectDir;

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
  runOptions?: {
    readonly ciSafe?: boolean;
    readonly linter?: UltraciteLinterId;
    readonly frameworks?: readonly UltraciteFrameworkId[];
  },
): Promise<void> => {
  if (!enabled) {
    return;
  }
  const u = getUltraciteInitCommand(packageManager, mode, {
    frameworks: runOptions?.frameworks,
    linter: runOptions?.linter,
  });
  const ciSafe = runOptions?.ciSafe ?? mode === "quiet";
  await runProcess(u.file, u.args, { ciSafe, cwd: projectDir, stepId: "ultracite" });
};
