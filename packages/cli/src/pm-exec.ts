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

const getShadcnCwdArgs = (
  monorepoWithDesignSystem: boolean,
): readonly ["-c", "packages/design-system"] | [] =>
  monorepoWithDesignSystem ? ["-c", "packages/design-system"] : [];

const buildShadcnCliInvocation = (
  pm: PackageManager,
  subcommands: readonly string[],
): { readonly args: readonly string[]; readonly file: string } => {
  const spec = getShadcnExecSpec();
  // Avoid `bun x shadcn@latest`: Bun often stalls after resolving the ephemeral CLI lockfile on some setups (e.g. WSL2).
  if (pm === "bun") {
    return { args: ["--yes", spec, ...subcommands], file: "npx" };
  }
  if (pm === "pnpm") {
    return { args: ["dlx", spec, ...subcommands], file: "pnpm" };
  }
  return { args: ["--yes", spec, ...subcommands], file: "npx" };
};

export const getShadcnBootstrapCommand = (
  pm: PackageManager,
  options: { readonly preset: string; readonly monorepoWithDesignSystem: boolean },
): { readonly file: string; readonly args: readonly string[] } => {
  const cwdArgs = getShadcnCwdArgs(options.monorepoWithDesignSystem);

  // We always use 'apply' because we scaffold a starting 'components.json' from our templates.
  // This bypasses the interactive/guessing nature of 'init' and ensures consistent setup.
  return buildShadcnCliInvocation(pm, ["apply", "--preset", options.preset, "-y", ...cwdArgs]);
};

/** Adds every component from the default registry after {@link getShadcnBootstrapCommand}. */
export const getShadcnAddAllCommand = (
  pm: PackageManager,
  options: { readonly monorepoWithDesignSystem: boolean },
): { readonly file: string; readonly args: readonly string[] } => {
  const cwdArgs = getShadcnCwdArgs(options.monorepoWithDesignSystem);
  return buildShadcnCliInvocation(pm, ["add", "--all", "-y", ...cwdArgs]);
};

/** `interactive`: Ultracite TUI; `quiet`: non-interactive (`-y`, adds `--quiet`). */
export type UltraciteInitMode = "interactive" | "quiet";

export const getUltraciteInitCommand = (
  pm: PackageManager,
  mode: UltraciteInitMode,
  options?: { readonly linter?: UltraciteLinterId },
): {
  readonly file: string;
  readonly args: readonly string[];
} => {
  const ultraciteSpec = getUltraciteExecSpec();
  const parts: string[] = ["init", "--pm", pm];
  if (options?.linter !== undefined) {
    parts.push("--linter", options.linter);
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
