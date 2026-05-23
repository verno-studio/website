import { DEFAULT_ULTRACITE_LINTER } from "../../ultracite-linter";
import type { UltraciteLinterId } from "../../ultracite-linter";
import type { AddonId, PackageManager } from "@vernostudio/template-generator";
import { parseAddonsArg } from "../shared/addons";
import {
  DEFAULT_SHADCN_PRESET,
  isPackageManager,
  isUiMode,
  PACKAGE_MANAGERS,
} from "../shared/input-primitives";
import type { UiMode } from "../shared/input-primitives";
import { parseUltraciteLinterFlag } from "../shared/ultracite";

export { DEFAULT_SHADCN_PRESET, isPackageManager, isUiMode, PACKAGE_MANAGERS, type UiMode };

/** Raw CLI flags for `verno init`. */
export interface InitCommandOptions {
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly noInstall: boolean;
  readonly skipShadcn: boolean;
  readonly skipUltracite: boolean;
  readonly addons?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
  readonly linter?: string;
  readonly packageManager?: string;
}

export const toInitCommandOptions = (raw: {
  readonly dryRun?: boolean;
  readonly yes?: boolean;
  readonly noInstall?: boolean;
  readonly skipShadcn?: boolean;
  readonly skipUltracite?: boolean;
  readonly addons?: string;
  readonly ui?: string;
  readonly shadcnPreset?: string;
  readonly linter?: string;
  readonly packageManager?: string;
}): InitCommandOptions => ({
  addons: raw.addons,
  dryRun: raw.dryRun ?? false,
  linter: raw.linter,
  noInstall: raw.noInstall ?? false,
  packageManager: raw.packageManager,
  shadcnPreset: raw.shadcnPreset,
  skipShadcn: raw.skipShadcn ?? false,
  skipUltracite: raw.skipUltracite ?? false,
  ui: raw.ui,
  yes: raw.yes ?? false,
});

/** Normalized inputs for `verno init`. */
export interface ResolvedInitInputs {
  readonly doInstall: boolean;
  readonly nonInteractive: boolean;
  readonly packageManager: PackageManager;
  readonly runUltracite: boolean;
  readonly shadcnPreset: string;
  readonly ultraciteLinter?: UltraciteLinterId;
  readonly ui: UiMode;
  readonly useShadcn: boolean;
  readonly addons: AddonId[];
}

const resolvePackageManagerNonInteractive = (
  options: InitCommandOptions,
): PackageManager | undefined => {
  const rawPackageManager = options.packageManager;
  if (rawPackageManager === undefined) {
    return undefined;
  }
  if (!isPackageManager(rawPackageManager)) {
    throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
  }
  return rawPackageManager;
};

const resolveUiNonInteractive = (options: InitCommandOptions): UiMode => {
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

export const resolveInitInputsNonInteractive = (
  options: InitCommandOptions,
): ResolvedInitInputs => {
  let addons = parseAddonsArg(options.addons);
  if (options.skipUltracite) {
    addons = addons.filter((a) => a !== "ultracite");
  }

  const packageManager = resolvePackageManagerNonInteractive(options);
  const ui = resolveUiNonInteractive(options);
  const ultraciteOn = addons.includes("ultracite");
  const flagged = parseUltraciteLinterFlag(options, ultraciteOn);
  const ultraciteLinter = ultraciteOn ? (flagged ?? DEFAULT_ULTRACITE_LINTER) : undefined;

  const useShadcn = ui === "shadcn" && !options.skipShadcn;

  return {
    addons,
    doInstall: !options.noInstall,
    nonInteractive: true,
    packageManager: packageManager ?? "bun",
    runUltracite: ultraciteOn,
    shadcnPreset: options.shadcnPreset ?? DEFAULT_SHADCN_PRESET,
    ui,
    ultraciteLinter,
    useShadcn,
  };
};
