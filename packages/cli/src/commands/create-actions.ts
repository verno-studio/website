import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { generateProject } from "@verno/template-generator";
import type { PackageManager, ProjectConfig, TemplateId } from "@verno/template-generator";
import {
  getPmInstallCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../pm-exec";
import { runProcess } from "../run";
import { getShadcnWorkingDirectory } from "./create-plan";

export const getProjectPath = (name: string): string => resolve(process.cwd(), name);

export const assertPathAvailable = (projectDir: string): void => {
  if (existsSync(projectDir)) {
    throw new Error(`Path already exists: ${projectDir}`);
  }
};

export const scaffold = async (
  config: ProjectConfig,
  onLine?: (line: string) => void,
): Promise<{ readonly filesWritten: number }> => {
  onLine?.(`\nScaffolding ${config.template} in ${config.projectDir} …`);
  const { filesWritten } = await generateProject(config);
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
  readonly template: TemplateId;
}): Promise<void> => {
  if (!options.enabled) {
    return;
  }
  const sh = getShadcnBootstrapCommand(options.packageManager, {
    preset: options.preset,
    template: options.template,
  });
  const cwd = getShadcnWorkingDirectory(options.projectDir, options.template);
  await runProcess(sh.file, sh.args, { cwd, stepId: "shadcn" });
};

export const runUltraciteIfEnabled = async (
  enabled: boolean,
  packageManager: PackageManager,
  projectDir: string,
): Promise<void> => {
  if (!enabled) {
    return;
  }
  const u = getUltraciteInitCommand(packageManager);
  await runProcess(u.file, u.args, { cwd: projectDir, stepId: "ultracite" });
};

export const runGitIfEnabled = async (enabled: boolean, projectDir: string): Promise<void> => {
  if (!enabled) {
    return;
  }
  await runProcess("git", ["init"], { cwd: projectDir, stepId: "git" });
};

/** @deprecated Use {@link getProjectPath} + {@link assertPathAvailable}. */
export const assertNewDirectory = (name: string): string => {
  const projectDir = getProjectPath(name);
  assertPathAvailable(projectDir);
  return projectDir;
};

export const buildConfig = (args: {
  readonly name: string;
  readonly npmScope: string;
  readonly packageManager: PackageManager;
  readonly projectDir: string;
  readonly shadcnPreset: string;
  readonly template: TemplateId;
}): ProjectConfig => ({
  npmScope: args.npmScope,
  packageManager: args.packageManager,
  projectDir: args.projectDir,
  projectName: args.name,
  shadcnPreset: args.shadcnPreset,
  template: args.template,
});

export { getShadcnWorkingDirectory } from "./create-plan";
