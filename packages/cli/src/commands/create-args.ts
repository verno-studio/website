import type { AddonId, FrontendId, PackageId, PackageManager } from "@vernostudio/template-generator";
import { ADDON_IDS, FRONTENDS, PACKAGE_IDS } from "@vernostudio/template-generator";
import type { UltraciteLinterId } from "../ultracite-linter";
import {
  DEFAULT_ULTRACITE_LINTER,
  ULTRACITE_LINTER_IDS,
  isUltraciteLinterId,
} from "../ultracite-linter";

export const PACKAGE_MANAGERS: readonly PackageManager[] = ["bun", "pnpm", "npm"];
export const DEFAULT_SHADCN_PRESET = "nova";

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

/** Default workspace packages when Turborepo is on and `--packages` is omitted. */
export const DEFAULT_WORKSPACE_PACKAGES: readonly PackageId[] = [
  "typescript-config",
  "design-system",
];

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
  readonly packageManager?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
  /** `ultracite init --linter` when the ultracite add-on is enabled. */
  readonly linter?: string;
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
  readonly packageManager?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
  readonly linter?: string;
}): CreateCommandOptions => ({
  addons: raw.addons,
  dryRun: raw.dryRun ?? false,
  frontend: raw.frontend,
  linter: raw.linter,
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
  /** Always set when ultracite add-on runs: CLI `--linter`, or interactive wizard, or `-y` default. */
  readonly ultraciteLinter?: UltraciteLinterId;
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
  const { skipShadcn, ui: rawUi } = options;
  let ui: UiMode = "shadcn";
  if (rawUi !== undefined && rawUi.length > 0) {
    if (!isUiMode(rawUi)) {
      throw new Error("Invalid --ui. Use: shadcn | none");
    }
    ui = rawUi;
  }
  if (skipShadcn) {
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
    packages = [...DEFAULT_WORKSPACE_PACKAGES];
  }
  if (!turborepoOn && packages.length > 0) {
    throw new Error("--packages requires turborepo in --addons.");
  }
  return ensureTypescriptWithDesignSystem(packages);
};

export const parseUltraciteLinterFlag = (
  options: CreateCommandOptions,
  ultraciteOn: boolean,
): UltraciteLinterId | undefined => {
  if (!ultraciteOn) {
    if (options.linter !== undefined && options.linter.length > 0) {
      throw new Error("--linter requires ultracite in --addons.");
    }
    return undefined;
  }
  const raw = options.linter;
  if (raw !== undefined && raw.length > 0) {
    if (!isUltraciteLinterId(raw)) {
      throw new Error(`Invalid --linter. Use: ${ULTRACITE_LINTER_IDS.join(" | ")}`);
    }
    return raw;
  }
  return undefined;
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
  const packageManager = resolvePackageManagerNonInteractive(options);
  const ui = resolveUiNonInteractive(options);
  const ultraciteOn = addons.includes("ultracite");
  const flagged = parseUltraciteLinterFlag(options, ultraciteOn);
  const ultraciteLinter = ultraciteOn ? (flagged ?? DEFAULT_ULTRACITE_LINTER) : undefined;

  return {
    addons,
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
    ultraciteLinter,
    useShadcn: ui === "shadcn" && !options.skipShadcn,
  };
};
