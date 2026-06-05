import * as p from "@clack/prompts";
import pc from "picocolors";
import { UserCancelledError } from "../../errors";
import { renderVernoTitle } from "../../ui";
import { parseAddonsArg } from "../shared/addons";
import { parseUltraciteFrameworksFlag, parseUltraciteLinterFlag } from "../shared/ultracite";
import { DEFAULT_ULTRACITE_FRAMEWORKS, ULTRACITE_FRAMEWORK_IDS } from "../../ultracite-framework";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import type { AddonId, PackageManager } from "@vernostudio/template-generator";
import { DEFAULT_ULTRACITE_LINTER } from "../../ultracite-linter";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { DEFAULT_SHADCN_PRESET, PACKAGE_MANAGERS, isPackageManager, isUiMode } from "./args";
import type { InitCommandOptions, ResolvedInitInputs, UiMode } from "./args";

const exitOnCancel = (value: unknown): void => {
  if (p.isCancel(value)) {
    throw new UserCancelledError("Setup cancelled.");
  }
};

const assertValue = <T>(v: T | symbol): T => {
  if (p.isCancel(v) || typeof v === "symbol") {
    throw new UserCancelledError("Setup cancelled.");
  }
  return v;
};

const PM_SELECT_OPTIONS = PACKAGE_MANAGERS.map((pm) => ({
  hint: pm === "bun" ? "detected / default" : undefined,
  label: pm,
  value: pm,
}));

const readAddonsInteractive = async (options: InitCommandOptions): Promise<readonly AddonId[]> => {
  if (options.addons !== undefined && options.addons.length > 0) {
    return parseAddonsArg(options.addons);
  }
  const selected = assertValue(
    await p.multiselect<AddonId>({
      initialValues: [],
      message: "Which add-ons would you like to add?",
      options: [
        {
          hint: "Add monorepo workspaces (turbo, apps/web, packages/*)",
          label: "Turborepo",
          value: "turborepo",
        },
        {
          hint: "Run ultracite init after install",
          label: "Ultracite (lint + format)",
          value: "ultracite",
        },
      ],
      required: false,
    }),
  );
  return (selected as AddonId[]).filter((a) => !options.skipUltracite || a !== "ultracite");
};

const readPackageManagerInteractive = async (
  detected: PackageManager | null,
  options: InitCommandOptions,
): Promise<PackageManager> => {
  const raw = options.packageManager;
  if (raw) {
    if (!isPackageManager(raw)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    return raw;
  }
  const initial: PackageManager = detected ?? "bun";
  const pm = assertValue(
    await p.select({
      initialValue: initial,
      message: "Package manager",
      options: PM_SELECT_OPTIONS,
    }),
  );
  return isPackageManager(pm) ? pm : "bun";
};

const readUiMode = async (options: InitCommandOptions): Promise<UiMode> => {
  if (options.skipShadcn) {
    return "none";
  }
  const rawUi = options.ui;
  if (rawUi !== undefined && rawUi.length > 0) {
    if (!isUiMode(rawUi)) {
      throw new Error("Invalid --ui. Use: shadcn | none");
    }
    return rawUi;
  }
  const u = assertValue(
    await p.select({
      initialValue: "shadcn" satisfies UiMode,
      message: "UI framework",
      options: [
        {
          hint: "run shadcn bootstrap after install",
          label: "shadcn",
          value: "shadcn",
        },
        { label: "none", value: "none" },
      ],
    }),
  );
  return isUiMode(u) ? u : "shadcn";
};

const readShadcnPreset = async (options: InitCommandOptions, ui: UiMode): Promise<string> => {
  if (options.shadcnPreset) {
    return options.shadcnPreset;
  }
  if (ui !== "shadcn") {
    return DEFAULT_SHADCN_PRESET;
  }
  const pr = await p.text({
    defaultValue: DEFAULT_SHADCN_PRESET,
    initialValue: DEFAULT_SHADCN_PRESET,
    message: "shadcn preset",
    placeholder: DEFAULT_SHADCN_PRESET,
  });
  exitOnCancel(pr);
  return (pr as string) || DEFAULT_SHADCN_PRESET;
};

const readDoInstall = async (hasNoInstall: boolean): Promise<boolean> => {
  if (hasNoInstall) {
    return false;
  }
  const c = await p.confirm({
    initialValue: true,
    message: "Install new dependencies now?",
  });
  exitOnCancel(c);
  return Boolean(c);
};

const readUltraciteLinter = async (
  options: InitCommandOptions,
  ultraciteOn: boolean,
): Promise<UltraciteLinterId | undefined> => {
  const fromFlag = parseUltraciteLinterFlag(options, ultraciteOn);
  if (!ultraciteOn) {
    return undefined;
  }
  if (fromFlag !== undefined) {
    return fromFlag;
  }
  return assertValue(
    await p.select<UltraciteLinterId>({
      initialValue: DEFAULT_ULTRACITE_LINTER,
      message: "Ultracite linter",
      options: [
        { label: "Oxlint + Oxfmt", value: "oxlint" },
        { label: "Biome", value: "biome" },
        { label: "ESLint + Prettier + Stylelint", value: "eslint" },
      ],
    }),
  );
};

const readUltraciteFrameworks = async (
  options: InitCommandOptions,
  ultraciteOn: boolean,
): Promise<UltraciteFrameworkId[] | undefined> => {
  const fromFlag = parseUltraciteFrameworksFlag(options, ultraciteOn);
  if (!ultraciteOn) {
    return undefined;
  }
  if (fromFlag !== undefined) {
    return fromFlag;
  }
  return assertValue(
    await p.multiselect<UltraciteFrameworkId>({
      initialValues: [...DEFAULT_ULTRACITE_FRAMEWORKS],
      message: "Ultracite frameworks (passed as --frameworks)",
      options: ULTRACITE_FRAMEWORK_IDS.map((id) => ({
        label: id,
        value: id,
      })),
      required: true,
    }),
  );
};

const addonsSummary = (addons: readonly AddonId[]): string =>
  addons.length > 0 ? addons.join(", ") : "none";

export const runInteractiveInitWizard = async (args: {
  readonly options: InitCommandOptions;
  readonly detected: {
    readonly projectName: string;
    readonly isMonorepo: boolean;
    readonly hasShadcn: boolean;
    readonly hasUltracite: boolean;
    readonly packageManager: PackageManager | null;
  };
}): Promise<ResolvedInitInputs> => {
  const { options, detected } = args;
  const hasNoInstall = options.noInstall;
  const hasSkipShadcn = options.skipShadcn;

  renderVernoTitle(false);
  p.intro(pc.magenta("Initializing Verno Studio in existing project"));
  p.log.info(
    "This wizard will guide you through adding components. Use arrow keys, Enter, and y/n.",
  );

  p.log.step("Detection");
  p.log.info(`Project:  ${detected.projectName}`);
  p.log.info(`Monorepo: ${detected.isMonorepo ? "yes" : "no"}`);
  p.log.info(`shadcn:   ${detected.hasShadcn ? "yes" : "no"}`);
  p.log.info(`Ultracite: ${detected.hasUltracite ? "yes" : "no"}`);
  p.log.info(`Pkg mgr:  ${detected.packageManager ?? "unknown"}`);

  p.log.step("Add-ons — what would you like to add?");
  p.log.info("Press Enter without selecting options to skip new add-ons.");
  const addons = await readAddonsInteractive(options);
  const ultraciteOn = addons.includes("ultracite");

  p.log.step("Tooling");
  const packageManager = await readPackageManagerInteractive(detected.packageManager, options);
  const ui = await readUiMode(options);
  const shadcnPreset = await readShadcnPreset(options, ui);

  p.log.step("Post-init");
  const doInstall = await readDoInstall(hasNoInstall);

  const ultraciteLinter = await readUltraciteLinter(options, ultraciteOn);
  const ultraciteFrameworks = await readUltraciteFrameworks(options, ultraciteOn);

  const useShadcn = ui === "shadcn" && !hasSkipShadcn;

  const summaryLines: string[] = [
    `Add-ons:        ${addonsSummary(addons)}`,
    `Package mgr:    ${packageManager}`,
    `UI:             ${useShadcn ? `shadcn (preset: ${shadcnPreset})` : "none"}`,
    `Install:        ${doInstall ? "yes" : "no"}`,
  ];

  if (ultraciteOn) {
    summaryLines.push(`Ultracite linter: ${ultraciteLinter ?? DEFAULT_ULTRACITE_LINTER}`);
    summaryLines.push(
      `Ultracite frameworks: ${(ultraciteFrameworks ?? DEFAULT_ULTRACITE_FRAMEWORKS).join(", ")}`,
    );
  }

  p.log.step("Review — confirm to continue");
  p.note(summaryLines.join("\n"), "Summary");

  const proceed = await p.confirm({
    initialValue: true,
    message: "Apply these changes to the current project?",
  });
  exitOnCancel(proceed);
  if (!proceed) {
    throw new UserCancelledError("Aborted on confirmation.");
  }

  return {
    addons: addons as AddonId[],
    doInstall,
    nonInteractive: false,
    packageManager,
    runUltracite: ultraciteOn,
    shadcnPreset,
    ui,
    ultraciteFrameworks,
    ultraciteLinter,
    useShadcn,
  };
};
