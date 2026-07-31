import type { PackageManager } from "@vernostudio/template-generator";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["bun", "pnpm", "npm"];

export const DEFAULT_SHADCN_PRESET = "nova";

export type UiMode = "none" | "shadcn";

export const isUiMode = (value: string | undefined): value is UiMode =>
  value === "shadcn" || value === "none";

export const isPackageManager = (value: string | undefined): value is PackageManager =>
  value === "bun" || value === "pnpm" || value === "npm";

const PROJECT_NAME_PATTERN = /^[a-z0-9-]+$/iu;

/** Letters, digits, and hyphens only — keeps the name valid as an npm package name and a directory under cwd. */
export const isValidProjectName = (value: string): boolean => PROJECT_NAME_PATTERN.test(value);
