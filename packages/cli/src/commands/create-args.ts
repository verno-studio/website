import type { PackageManager, TemplateId } from "@verno/template-generator";

export const TEMPLATES: readonly TemplateId[] = ["next-app", "next-turborepo"];
export const PACKAGE_MANAGERS: readonly PackageManager[] = ["bun", "pnpm", "npm"];
export const DEFAULT_SHADCN_PRESET = "nova";

export const isTemplateId = (value: string | undefined): value is TemplateId =>
  value === "next-app" || value === "next-turborepo";

export const isPackageManager = (value: string | undefined): value is PackageManager =>
  value === "bun" || value === "pnpm" || value === "npm";

export type UiMode = "shadcn" | "none";

export const isUiMode = (value: string | undefined): value is UiMode =>
  value === "shadcn" || value === "none";

/** Normalized options for `verno create` (from Commander). */
export interface CreateCommandOptions {
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly noGit: boolean;
  readonly noInstall: boolean;
  readonly skipShadcn: boolean;
  readonly skipUltracite: boolean;
  readonly template?: string;
  readonly packageManager?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
}

export const toCreateCommandOptions = (raw: {
  readonly dryRun?: boolean;
  readonly yes?: boolean;
  readonly noGit?: boolean;
  readonly noInstall?: boolean;
  readonly skipShadcn?: boolean;
  readonly skipUltracite?: boolean;
  readonly template?: string;
  readonly packageManager?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
}): CreateCommandOptions => ({
  dryRun: raw.dryRun ?? false,
  noGit: raw.noGit ?? false,
  noInstall: raw.noInstall ?? false,
  packageManager: raw.packageManager,
  shadcnPreset: raw.shadcnPreset,
  skipShadcn: raw.skipShadcn ?? false,
  skipUltracite: raw.skipUltracite ?? false,
  template: raw.template,
  ui: raw.ui,
  yes: raw.yes ?? false,
});

export interface ResolvedCreateInputs {
  readonly doGit: boolean;
  readonly doInstall: boolean;
  readonly name: string;
  readonly packageManager: PackageManager;
  readonly runUltracite: boolean;
  readonly shadcnPreset: string;
  readonly template: TemplateId;
  readonly ui: UiMode;
  readonly useShadcn: boolean;
}

export const resolveCreateInputsNonInteractive = (
  name: string,
  options: CreateCommandOptions,
): ResolvedCreateInputs => {
  if (!name) {
    throw new Error("Project name is required. Example: verno create my-app -y");
  }

  let template: TemplateId;
  if (options.template) {
    if (!isTemplateId(options.template)) {
      throw new Error(`Invalid --template. Use: ${TEMPLATES.join(" | ")}`);
    }
    ({ template } = options);
  } else {
    template = "next-app";
  }

  let packageManager: PackageManager;
  const rawPackageManager = options.packageManager;
  if (rawPackageManager) {
    if (!isPackageManager(rawPackageManager)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    packageManager = rawPackageManager;
  } else {
    packageManager = "bun";
  }

  let ui: UiMode;
  if (options.ui) {
    if (!isUiMode(options.ui)) {
      throw new Error("Invalid --ui. Use: shadcn | none");
    }
    ({ ui } = options);
  } else {
    ui = "shadcn";
  }
  if (options.skipShadcn) {
    ui = "none";
  }
  return {
    doGit: !options.noGit,
    doInstall: !options.noInstall,
    name,
    packageManager,
    runUltracite: !options.skipUltracite,
    shadcnPreset: options.shadcnPreset ?? DEFAULT_SHADCN_PRESET,
    template,
    ui,
    useShadcn: ui === "shadcn" && !options.skipShadcn,
  };
};
