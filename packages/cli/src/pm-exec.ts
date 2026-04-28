import type { PackageManager } from "@verno/template-generator";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@verno/template-generator";
import type { UltraciteLinterId } from "./ultracite-linter";

export const getPmInstallCommand = (
  pm: PackageManager,
): {
  readonly file: string;
  readonly args: readonly string[];
} => {
  if (pm === "bun") {
    return { args: ["install"], file: "bun" };
  }
  if (pm === "pnpm") {
    return { args: ["install"], file: "pnpm" };
  }
  return { args: ["install"], file: "npm" };
};

export const getShadcnBootstrapCommand = (
  pm: PackageManager,
  options: { readonly preset: string; readonly monorepoWithDesignSystem: boolean },
): { readonly file: string; readonly args: readonly string[] } => {
  const shadcnSpec = getShadcnExecSpec();
  const afterInit = ["init", "-t", "next", "-p", options.preset, "-y"] as const;
  // Monorepo + design-system: run from repo root so shadcn detects bun/pnpm from the workspace lockfile.
  const cwdFlag = options.monorepoWithDesignSystem
    ? (["-c", "packages/design-system"] as const)
    : ([] as const);
  const initArgs = [...afterInit, ...cwdFlag];
  // Avoid `bun x shadcn@latest`: Bun often stalls after resolving the ephemeral CLI lockfile on some setups (e.g. WSL2).
  if (pm === "bun") {
    return { args: ["--yes", shadcnSpec, ...initArgs], file: "npx" };
  }
  if (pm === "pnpm") {
    return { args: ["dlx", shadcnSpec, ...initArgs], file: "pnpm" };
  }
  return { args: ["--yes", shadcnSpec, ...initArgs], file: "npx" };
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
