import type { PackageManager, TemplateId } from "@verno/template-generator";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@verno/template-generator";

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
  options: { readonly preset: string; readonly template: TemplateId },
): { readonly file: string; readonly args: readonly string[] } => {
  const shadcnSpec = getShadcnExecSpec();
  const afterInit = ["init", "-t", "next", "-p", options.preset, "-y"] as const;
  if (pm === "bun") {
    return { args: ["x", "--bun", shadcnSpec, ...afterInit], file: "bun" };
  }
  if (pm === "pnpm") {
    return { args: ["dlx", shadcnSpec, ...afterInit], file: "pnpm" };
  }
  return { args: ["--yes", shadcnSpec, ...afterInit], file: "npx" };
};

export const getUltraciteInitCommand = (
  pm: PackageManager,
): {
  readonly file: string;
  readonly args: readonly string[];
} => {
  const ultraciteSpec = getUltraciteExecSpec();
  const rest = [
    "init",
    "--pm",
    pm,
    "--linter",
    "oxlint",
    "--frameworks",
    "react",
    "next",
    "--editors",
    "vscode",
    "cursor",
    "--quiet",
  ] as const;
  if (pm === "bun") {
    return { args: ["x", ultraciteSpec, ...rest], file: "bun" };
  }
  if (pm === "pnpm") {
    return { args: ["dlx", ultraciteSpec, ...rest], file: "pnpm" };
  }
  return { args: ["--yes", ultraciteSpec, ...rest], file: "npx" };
};
