import type { PackageManager } from "@vernostudio/template-generator";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["bun", "pnpm", "npm"];

export const DEFAULT_SHADCN_PRESET = "nova";

export type UiMode = "none" | "shadcn";

export const isUiMode = (value: string | undefined): value is UiMode =>
  value === "shadcn" || value === "none";

export const isPackageManager = (value: string | undefined): value is PackageManager =>
  value === "bun" || value === "pnpm" || value === "npm";
