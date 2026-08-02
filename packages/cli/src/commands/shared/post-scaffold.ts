import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PackageManager } from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../../pm-exec";
import type { UltraciteInitMode } from "../../pm-exec";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { ensureComponentsJsonRegistries } from "../../components-json";
import { runProcess } from "../../run";

export const getShadcnWorkingDirectory = (projectDir: string, monorepo: boolean): string =>
  monorepo ? path.join(projectDir, "apps", "web") : projectDir;

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

/**
 * Whether the shadcn bootstrap should write a decoy `vite.config.ts` to force
 * framework detection. When a real `vite.config.ts` already exists in
 * `workingDir`, it must be left untouched (and never deleted afterward) —
 * its presence already satisfies shadcn's detection.
 */
export const shouldWriteDecoyConfig = (workingDir: string): boolean =>
  !existsSync(path.join(workingDir, "vite.config.ts"));

export const runShadcnIfEnabled = async (options: {
  readonly enabled: boolean;
  readonly packageManager: PackageManager;
  readonly preset: string;
  readonly projectDir: string;
  readonly monorepo: boolean;
}): Promise<void> => {
  if (!options.enabled) {
    return;
  }

  const workingDir = getShadcnWorkingDirectory(
    options.projectDir,
    options.monorepo,
  );

  // shadcn apply/add requires a detected framework (Next.js, Vite, etc.).
  // We write a temporary dummy config to ensure detection passes in all environments.
  const dummyConfigPath = path.join(workingDir, "vite.config.ts");
  const hasRealViteConfig = !shouldWriteDecoyConfig(workingDir);
  if (!hasRealViteConfig) {
    await writeFile(dummyConfigPath, "export default {};\n", "utf-8");
  }

  try {
    const bootstrap = getShadcnBootstrapCommand(options.packageManager, {
      monorepo: options.monorepo,
      preset: options.preset,
    });
    const addAll = getShadcnAddAllCommand(options.packageManager, {
      monorepo: options.monorepo,
    });

    for (const cmd of [bootstrap, addAll]) {
      // oxlint-disable-next-line no-await-in-loop -- sequential by design
      await runProcess(cmd.file, cmd.args, {
        ciSafe: false,
        cwd: options.projectDir,
        stepId: "shadcn",
      });
    }
  } finally {
    if (!hasRealViteConfig) {
      await rm(dummyConfigPath, { force: true }).catch(() => {
        /* ignore cleanup errors */
      });
    }
  }

  // `shadcn apply` rewrote components.json; put the registry namespace back.
  await ensureComponentsJsonRegistries(options.projectDir, options.monorepo);
};

export const runUltraciteIfEnabled = async (
  enabled: boolean,
  packageManager: PackageManager,
  projectDir: string,
  mode: UltraciteInitMode,
  runOptions?: {
    readonly ciSafe?: boolean;
    readonly linter?: UltraciteLinterId;
    readonly frameworks?: readonly string[];
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
