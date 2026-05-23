import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { generate, writeTree } from "@vernostudio/template-generator";
import type { PackageManager, ProjectConfig } from "@vernostudio/template-generator";
import { runProcess } from "../../run";
import type { ResolvedCreateInputs } from "./args";
import { VERNO_INITIAL_COMMIT_BODY, VERNO_INITIAL_COMMIT_SUBJECT } from "../../constants";

export { ensureAppGlobalsBaseLayerAtEnd } from "../../app-globals";
export {
  buildVernoManifestForCreate as buildVernoManifest,
  writeVernoManifest,
} from "../shared/manifest";
export type { VernoManifest } from "../shared/manifest";

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
