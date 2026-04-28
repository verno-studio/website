export type PackageManager = "bun" | "pnpm" | "npm";

/** Only Next.js is supported for now; kept for forward compatibility. */
export type FrontendId = "next";

export const FRONTENDS: readonly FrontendId[] = ["next"] as const;

export type AddonId = "turborepo" | "ultracite";

export const ADDON_IDS: readonly AddonId[] = ["turborepo", "ultracite"] as const;

export type PackageId = "typescript-config" | "design-system";

export const PACKAGE_IDS: readonly PackageId[] = ["typescript-config", "design-system"] as const;

export type CodeQualityId = "biome" | "oxlint-oxfmt" | "eslint-prettier";

export const CODE_QUALITY_IDS: readonly CodeQualityId[] = [
  "biome",
  "eslint-prettier",
  "oxlint-oxfmt",
] as const;

export type UiMode = "none" | "shadcn";

export interface ProjectConfig {
  readonly projectName: string;
  readonly packageManager: PackageManager;
  readonly npmScope: string;
  readonly frontend: FrontendId;
  readonly addons: readonly AddonId[];
  /** Workspace packages; only when `turborepo` is enabled. */
  readonly packages: readonly PackageId[];
  /** Meaningful when `ultracite` addon is enabled (used in template context / summary). */
  readonly codeQuality?: CodeQualityId;
  readonly ui: UiMode;
  readonly shadcnPreset?: string;
}

export const defaultNpmScopeFromProjectName = (projectName: string): string => {
  const slug = projectName
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
  if (slug.length > 0) {
    return slug;
  }
  return "app";
};

export const hasAddon = (config: ProjectConfig, id: AddonId): boolean => config.addons.includes(id);

export const hasPackage = (config: ProjectConfig, id: PackageId): boolean =>
  config.packages.includes(id);

export const isMonorepo = (config: ProjectConfig): boolean => hasAddon(config, "turborepo");

export const hasDesignSystem = (config: ProjectConfig): boolean =>
  isMonorepo(config) && hasPackage(config, "design-system");

export const hasTypescriptConfigPackage = (config: ProjectConfig): boolean =>
  isMonorepo(config) && hasPackage(config, "typescript-config");

export class InvalidProjectConfigError extends Error {
  public override readonly name = "InvalidProjectConfigError";

  public constructor(message: string) {
    super(message);
  }
}

/** Ensures composable config rules; call before generate. */
export const assertValidProjectConfig = (config: ProjectConfig): void => {
  if (!FRONTENDS.includes(config.frontend)) {
    throw new InvalidProjectConfigError(
      `Unsupported frontend "${config.frontend}". Use: ${FRONTENDS.join(" | ")}`,
    );
  }

  const addonsUnique = new Set(config.addons);
  if (addonsUnique.size !== config.addons.length) {
    throw new InvalidProjectConfigError("Duplicate addon entries are not allowed.");
  }

  for (const a of config.addons) {
    if (!ADDON_IDS.includes(a)) {
      throw new InvalidProjectConfigError(`Unknown addon "${a}".`);
    }
  }

  if (!isMonorepo(config) && config.packages.length > 0) {
    throw new InvalidProjectConfigError(
      "Workspace packages require the turborepo addon — clear packages or enable turborepo.",
    );
  }

  if (isMonorepo(config)) {
    for (const p of config.packages) {
      if (!PACKAGE_IDS.includes(p)) {
        throw new InvalidProjectConfigError(`Unknown package "${p}".`);
      }
    }
  }

  if (hasPackage(config, "design-system") && !hasPackage(config, "typescript-config")) {
    throw new InvalidProjectConfigError(
      "design-system package requires typescript-config in the same workspace.",
    );
  }

  if (config.codeQuality !== undefined && !hasAddon(config, "ultracite")) {
    throw new InvalidProjectConfigError(
      "codeQuality is only valid when the ultracite addon is enabled.",
    );
  }

  if (config.codeQuality !== undefined && !CODE_QUALITY_IDS.includes(config.codeQuality)) {
    throw new InvalidProjectConfigError(`Unknown codeQuality "${config.codeQuality}".`);
  }

  if (hasAddon(config, "ultracite") && config.codeQuality === undefined) {
    throw new InvalidProjectConfigError(
      "codeQuality is required when the ultracite addon is enabled (e.g. oxlint-oxfmt).",
    );
  }
};
