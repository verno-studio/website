import type {
  AddonId,
  CodeQualityId,
  FrontendId,
  PackageId,
  PackageManager,
} from "@verno/template-generator";
import { ADDON_IDS, CODE_QUALITY_IDS, FRONTENDS, PACKAGE_IDS } from "@verno/template-generator";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["bun", "pnpm", "npm"];
export const DEFAULT_SHADCN_PRESET = "nova";
export const DEFAULT_CODE_QUALITY = "oxlint-oxfmt" satisfies CodeQualityId;

export const isFrontendId = (value: string | undefined): value is FrontendId =>
  value !== undefined && (FRONTENDS as readonly string[]).includes(value);

export const isPackageManager = (value: string | undefined): value is PackageManager =>
  value === "bun" || value === "pnpm" || value === "npm";

export type UiMode = "none" | "shadcn";

export const isUiMode = (value: string | undefined): value is UiMode =>
  value === "shadcn" || value === "none";

export const isAddonId = (value: string): value is AddonId =>
  (ADDON_IDS as readonly string[]).includes(value);

export const isPackageId = (value: string): value is PackageId =>
  (PACKAGE_IDS as readonly string[]).includes(value);

export const isCodeQualityId = (value: string | undefined): value is CodeQualityId =>
  value !== undefined && (CODE_QUALITY_IDS as readonly string[]).includes(value);

const splitCommaList = (raw: string | undefined): string[] =>
  raw === undefined || raw.trim().length === 0
    ? []
    : raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

export const parseAddonsArg = (raw: string | undefined): AddonId[] => {
  const out: AddonId[] = [];
  for (const part of splitCommaList(raw)) {
    if (!isAddonId(part)) {
      throw new Error(`Invalid addon "${part}". Use: ${ADDON_IDS.join(", ")}`);
    }
    if (!out.includes(part)) {
      out.push(part);
    }
  }
  return out;
};

export const parsePackagesArg = (raw: string | undefined): PackageId[] => {
  const out: PackageId[] = [];
  for (const part of splitCommaList(raw)) {
    if (!isPackageId(part)) {
      throw new Error(`Invalid package "${part}". Use: ${PACKAGE_IDS.join(", ")}`);
    }
    if (!out.includes(part)) {
      out.push(part);
    }
  }
  return out;
};

/** Ensures `typescript-config` is listed when `design-system` is selected. */
export const ensureTypescriptWithDesignSystem = (packages: PackageId[]): PackageId[] => {
  if (packages.includes("design-system") && !packages.includes("typescript-config")) {
    return ["typescript-config", ...packages.filter((id) => id !== "typescript-config")];
  }
  return packages;
};

const defaultPackagesWhenTurborepo = (): PackageId[] => ["typescript-config", "design-system"];

/** Normalized options for `verno create` (from Commander). */
export interface CreateCommandOptions {
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly noGit: boolean;
  readonly noInstall: boolean;
  readonly skipShadcn: boolean;
  readonly skipUltracite: boolean;
  readonly frontend?: string;
  readonly addons?: string;
  readonly packages?: string;
  readonly codeQuality?: string;
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
  readonly frontend?: string;
  readonly addons?: string;
  readonly packages?: string;
  readonly codeQuality?: string;
  readonly packageManager?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
}): CreateCommandOptions => ({
  addons: raw.addons,
  codeQuality: raw.codeQuality,
  dryRun: raw.dryRun ?? false,
  frontend: raw.frontend,
  noGit: raw.noGit ?? false,
  noInstall: raw.noInstall ?? false,
  packageManager: raw.packageManager,
  packages: raw.packages,
  shadcnPreset: raw.shadcnPreset,
  skipShadcn: raw.skipShadcn ?? false,
  skipUltracite: raw.skipUltracite ?? false,
  ui: raw.ui,
  yes: raw.yes ?? false,
});

export interface ResolvedCreateInputs {
  readonly doGit: boolean;
  readonly doInstall: boolean;
  readonly name: string;
  /** True when `verno create -y` — use non-interactive hooks (e.g. `ultracite init --quiet`). */
  readonly nonInteractive: boolean;
  readonly packageManager: PackageManager;
  readonly runUltracite: boolean;
  readonly shadcnPreset: string;
  readonly frontend: FrontendId;
  readonly addons: readonly AddonId[];
  readonly packages: readonly PackageId[];
  readonly codeQuality?: CodeQualityId;
  readonly ui: UiMode;
  readonly useShadcn: boolean;
}

export const resolvedUsesTurborepo = (r: ResolvedCreateInputs): boolean =>
  r.addons.includes("turborepo");

export const resolvedHasDesignSystem = (r: ResolvedCreateInputs): boolean =>
  resolvedUsesTurborepo(r) && r.packages.includes("design-system");

const readFrontendNonInteractive = (options: CreateCommandOptions): FrontendId => {
  const raw = options.frontend;
  if (raw === undefined || raw.length === 0) {
    return "next";
  }
  if (!isFrontendId(raw)) {
    throw new Error(`Invalid --frontend. Use: ${FRONTENDS.join(" | ")}`);
  }
  return raw;
};

const resolveCodeQualityNonInteractive = (
  options: CreateCommandOptions,
  ultraciteOn: boolean,
): CodeQualityId | undefined => {
  if (!ultraciteOn) {
    if (options.codeQuality !== undefined && options.codeQuality.length > 0) {
      throw new Error("--code-quality requires ultracite in --addons.");
    }
    return undefined;
  }
  const rawQ = options.codeQuality;
  if (rawQ !== undefined && rawQ.length > 0) {
    if (!isCodeQualityId(rawQ)) {
      throw new Error(`Invalid --code-quality. Use: ${CODE_QUALITY_IDS.join(" | ")}`);
    }
    return rawQ;
  }
  return DEFAULT_CODE_QUALITY;
};

const resolvePackageManagerNonInteractive = (options: CreateCommandOptions): PackageManager => {
  const rawPackageManager = options.packageManager;
  if (rawPackageManager === undefined) {
    return "bun";
  }
  if (!isPackageManager(rawPackageManager)) {
    throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
  }
  return rawPackageManager;
};

const resolveUiNonInteractive = (options: CreateCommandOptions): UiMode => {
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
    return "none";
  }
  return ui;
};

const resolveWorkspacePackagesNonInteractive = (
  options: CreateCommandOptions,
  turborepoOn: boolean,
): PackageId[] => {
  let packages = parsePackagesArg(options.packages);
  if (turborepoOn && packages.length === 0) {
    packages = defaultPackagesWhenTurborepo();
  }
  if (!turborepoOn && packages.length > 0) {
    throw new Error("--packages requires turborepo in --addons.");
  }
  return ensureTypescriptWithDesignSystem(packages);
};

export const resolveCreateInputsNonInteractive = (
  name: string,
  options: CreateCommandOptions,
): ResolvedCreateInputs => {
  if (!name) {
    throw new Error("Project name is required. Example: verno create my-app -y");
  }

  const frontend = readFrontendNonInteractive(options);

  let addons = parseAddonsArg(options.addons);
  if (options.skipUltracite) {
    addons = addons.filter((a) => a !== "ultracite");
  }

  const turborepoOn = addons.includes("turborepo");
  const packages = resolveWorkspacePackagesNonInteractive(options, turborepoOn);
  const codeQuality = resolveCodeQualityNonInteractive(options, addons.includes("ultracite"));
  const packageManager = resolvePackageManagerNonInteractive(options);
  const ui = resolveUiNonInteractive(options);

  return {
    addons,
    codeQuality,
    doGit: !options.noGit,
    doInstall: !options.noInstall,
    frontend,
    name,
    nonInteractive: true,
    packageManager,
    packages,
    runUltracite: addons.includes("ultracite"),
    shadcnPreset: options.shadcnPreset ?? DEFAULT_SHADCN_PRESET,
    ui,
    useShadcn: ui === "shadcn" && !options.skipShadcn,
  };
};
