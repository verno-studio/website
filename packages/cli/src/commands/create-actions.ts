import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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

/** Sync with `packages/template-generator/templates/frontends/next/app/globals.css.hbs`. */
export const VERNO_APP_GLOBALS_BASE_MARKER = "/* This layer is by Verno Studio */" as const;

const VERNO_INITIAL_COMMIT_SUBJECT = "Initial commit from Verno Studio" as const;
const VERNO_INITIAL_COMMIT_BODY = "Generated-by: Verno Studio" as const;

const trimEndWhitespace = (value: string): string => value.replace(/\s+$/u, "");

export const VERNO_APP_GLOBALS_BASE_LAYER = `${VERNO_APP_GLOBALS_BASE_MARKER}
@layer base {
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    @apply border-border;
  }
  ::selection {
    @apply bg-primary text-background;
  }
  * {
    @apply border-border outline-ring/50;
  }
  html {
    font-feature-settings: "ss01";
    text-rendering: optimizeLegibility;
  }
  body {
    @apply min-h-dvh;
    @apply bg-background text-foreground;
  }
  input::placeholder,
  textarea::placeholder {
    @apply text-muted-foreground;
  }
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    @apply cursor-pointer;
  }
  a[target="_blank"],
  a[target="_blank"] *,
  a[href^="mailto:"],
  a[href^="mailto:"] * {
    @apply cursor-alias;
  }
  button:focus,
  input:focus,
  textarea:focus,
  a:focus {
    @apply focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
}` as const;

export const getAppGlobalsCssPath = (projectDir: string, monorepo: boolean): string =>
  monorepo
    ? join(projectDir, "apps", "web", "app", "globals.css")
    : join(projectDir, "app", "globals.css");

const stripAppGlobalsBaseLayer = (content: string): string => {
  const markerIndex = content.indexOf(VERNO_APP_GLOBALS_BASE_MARKER);
  if (markerIndex === -1) {
    return trimEndWhitespace(content);
  }
  const layerStart = content.indexOf("@layer base", markerIndex);
  if (layerStart === -1) {
    return trimEndWhitespace(content.slice(0, markerIndex));
  }
  const blockOpen = content.indexOf("{", layerStart);
  if (blockOpen === -1) {
    return trimEndWhitespace(content.slice(0, markerIndex));
  }
  let depth = 0;
  for (let i = blockOpen; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const before = content.slice(0, markerIndex);
        const after = content.slice(i + 1).replace(/^\s*\n/u, "");
        return trimEndWhitespace(before + after);
      }
    }
  }
  return trimEndWhitespace(content.slice(0, markerIndex));
};

export const ensureAppGlobalsBaseLayerContent = (content: string): string => {
  const stripped = stripAppGlobalsBaseLayer(content);
  const needsNewlineBeforeBlock = stripped.length > 0 && !stripped.endsWith("\n");
  const gap = needsNewlineBeforeBlock ? "\n" : "";
  return `${stripped}${gap}${VERNO_APP_GLOBALS_BASE_LAYER}\n`;
};

export const ensureAppGlobalsBaseLayerAtEnd = async (
  projectDir: string,
  monorepo: boolean,
): Promise<void> => {
  const path = getAppGlobalsCssPath(projectDir, monorepo);
  if (!existsSync(path)) {
    return;
  }
  const raw = await readFile(path, "utf-8");
  const next = ensureAppGlobalsBaseLayerContent(raw);
  if (next !== raw) {
    await writeFile(path, next, "utf-8");
  }
};

const readCliPackageVersion = (): string => {
  try {
    const pkgPath = join(import.meta.dirname, "..", "..", "package.json");
    const parsed = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return parsed.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
};

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
  /** Linter passed to `ultracite init --linter` when the ultracite add-on ran (wizard, CLI flag, or `-y` default). */
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
  const dir = join(projectDir, ".verno");
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

  let dummyConfigPath: string | undefined;
  if (options.monorepoWithDesignSystem) {
    dummyConfigPath = join(options.projectDir, "packages", "design-system", "vite.config.ts");
    await writeFile(dummyConfigPath, "export default {};\n", "utf-8");
  }

  try {
    const commands = [
      getShadcnBootstrapCommand(options.packageManager, {
        monorepoWithDesignSystem: options.monorepoWithDesignSystem,
        preset: options.preset,
      }),
      getShadcnAddAllCommand(options.packageManager, {
        monorepoWithDesignSystem: options.monorepoWithDesignSystem,
      }),
    ] as const;

    for (const command of commands) {
      await runProcess(command.file, command.args, {
        ciSafe: false,
        cwd: options.projectDir,
        stepId: "shadcn",
      });
    }
  } finally {
    if (dummyConfigPath) {
      try {
        await rm(dummyConfigPath, { force: true });
      } catch {
        // Ignored during cleanup
      }
    }
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

export { getShadcnWorkingDirectory } from "./create-plan";
