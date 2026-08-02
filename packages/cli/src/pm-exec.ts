import type { PackageManager } from "@vernostudio/template-generator";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@vernostudio/template-generator";
import type { UltraciteLinterId } from "./ultracite-linter";

export const getPmInstallCommand = (
  pm: PackageManager,
): {
  readonly file: string;
  readonly args: readonly string[];
} => ({
  args: ["install"],
  file: pm,
});

/**
 * `components.json` is scaffolded next to the app it configures: `apps/web` in a
 * Turborepo layout, the project root otherwise. shadcn resolves it from its own
 * cwd and does not search downward, so a monorepo has to be pointed at the app.
 */
const getShadcnCwdArgs = (monorepo: boolean): readonly ["-c", "apps/web"] | [] =>
  monorepo ? ["-c", "apps/web"] : [];

const buildShadcnCliInvocation = (
  pm: PackageManager,
  subcommands: readonly string[],
): { readonly args: readonly string[]; readonly file: string } => {
  const spec = getShadcnExecSpec();
  if (pm === "pnpm") {
    return { args: ["dlx", spec, ...subcommands], file: "pnpm" };
  }
  // bun falls through to npx as well: `bun x shadcn@latest` often stalls after
  // resolving the ephemeral CLI lockfile on some setups (e.g. WSL2).
  return { args: ["--yes", spec, ...subcommands], file: "npx" };
};

export const getShadcnBootstrapCommand = (
  pm: PackageManager,
  options: { readonly preset: string; readonly monorepo: boolean },
): { readonly file: string; readonly args: readonly string[] } => {
  const cwdArgs = getShadcnCwdArgs(options.monorepo);

  // We always use 'apply' because we scaffold a starting 'components.json' from our templates.
  // This bypasses the interactive/guessing nature of 'init' and ensures consistent setup.
  return buildShadcnCliInvocation(pm, ["apply", "--preset", options.preset, "-y", ...cwdArgs]);
};

/** Adds every component from the default registry after {@link getShadcnBootstrapCommand}. */
export const getShadcnAddAllCommand = (
  pm: PackageManager,
  options: { readonly monorepo: boolean },
): { readonly file: string; readonly args: readonly string[] } => {
  const cwdArgs = getShadcnCwdArgs(options.monorepo);
  return buildShadcnCliInvocation(pm, ["add", "--all", "-y", ...cwdArgs]);
};

/** `interactive`: Ultracite TUI; `quiet`: non-interactive (`-y`, adds `--quiet`). */
export type UltraciteInitMode = "interactive" | "quiet";

export const getUltraciteInitCommand = (
  pm: PackageManager,
  mode: UltraciteInitMode,
  options?: {
    readonly linter?: UltraciteLinterId;
    readonly frameworks?: readonly string[];
  },
): {
  readonly file: string;
  readonly args: readonly string[];
} => {
  const ultraciteSpec = getUltraciteExecSpec();
  const parts: string[] = ["init", "--pm", pm];
  if (options?.linter !== undefined) {
    parts.push("--linter", options.linter);
  }
  if (options?.frameworks !== undefined && options.frameworks.length > 0) {
    parts.push("--frameworks", ...options.frameworks);
  }
  if (mode === "quiet") {
    parts.push("--quiet");
  }
  if (pm === "bun") {
    return { args: ["x", ultraciteSpec, ...parts], file: "bun" };
  }
  if (pm === "pnpm") {
    return { args: ["dlx", ultraciteSpec, ...parts], file: "pnpm" };
  }
  return { args: ["--yes", ultraciteSpec, ...parts], file: "npx" };
};
