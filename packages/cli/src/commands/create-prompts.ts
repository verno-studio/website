import * as p from "@clack/prompts";
import pc from "picocolors";
import type { AddonId, CodeQualityId, PackageId, PackageManager } from "@verno/template-generator";
import { CODE_QUALITY_IDS } from "@verno/template-generator";
import { UserCancelledError } from "../errors";
import { renderVernoTitle } from "../ui";
import {
  DEFAULT_SHADCN_PRESET,
  ensureTypescriptWithDesignSystem,
  isCodeQualityId,
  isPackageManager,
  isUiMode,
  PACKAGE_MANAGERS,
  parseAddonsArg,
  parsePackagesArg,
} from "./create-args";
import type { CreateCommandOptions, ResolvedCreateInputs, UiMode } from "./create-args";

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
  hint: pm === "bun" ? "default" : undefined,
  label: pm,
  value: pm,
}));

const readProjectName = async (positionalName: string | undefined): Promise<string> => {
  if (positionalName) {
    return positionalName;
  }
  const n = await p.text({
    message: "Project name",
    placeholder: "my-app",
    validate: (v) => {
      if (!v) {
        return "Project name is required";
      }
      if (!/^[a-z0-9-]+$/i.test(v)) {
        return "Use letters, numbers, and hyphens only";
      }
    },
  });
  exitOnCancel(n);
  return n as string;
};

const applySkipUltracite = (addons: AddonId[], skip: boolean): AddonId[] =>
  skip ? addons.filter((a) => a !== "ultracite") : addons;

const readAddonsInteractive = async (options: CreateCommandOptions): Promise<AddonId[]> => {
  if (options.addons !== undefined && options.addons.length > 0) {
    return applySkipUltracite(parseAddonsArg(options.addons), options.skipUltracite);
  }
  const initial: AddonId[] = options.skipUltracite ? [] : ["ultracite"];
  const selected = assertValue(
    await p.multiselect<AddonId>({
      initialValues: initial,
      message: "Add-ons",
      options: [
        {
          hint: "Next.js in apps/web + packages/*",
          label: "Turborepo (monorepo workspaces)",
          value: "turborepo",
        },
        {
          hint: "Adds Ultracite; `ultracite init` picks Biome vs Oxlint vs ESLint",
          label: "Ultracite (lint + format)",
          value: "ultracite",
        },
      ],
      required: false,
    }),
  );
  return applySkipUltracite(selected as AddonId[], options.skipUltracite);
};

const PACKAGE_OPTION_DESCRIPTORS = [
  { hint: "shared tsconfig" as const, id: "typescript-config" as const },
  { hint: "requires typescript-config" as const, id: "design-system" as const },
] as const;

const defaultPackagesForTurborepo = (): PackageId[] => ["typescript-config", "design-system"];

const readPackagesInteractive = async (
  options: CreateCommandOptions,
  turborepoOn: boolean,
): Promise<PackageId[]> => {
  if (!turborepoOn) {
    if (options.packages !== undefined && options.packages.length > 0) {
      throw new Error("--packages requires turborepo. Enable turborepo in --addons.");
    }
    return [];
  }
  if (options.packages !== undefined && options.packages.length > 0) {
    return ensureTypescriptWithDesignSystem(parsePackagesArg(options.packages));
  }
  const selected = assertValue(
    await p.multiselect<PackageId>({
      initialValues: defaultPackagesForTurborepo(),
      message: "Workspace packages (under packages/*)",
      options: PACKAGE_OPTION_DESCRIPTORS.map(({ hint, id }) => ({
        hint,
        label: id,
        value: id,
      })),
      required: false,
    }),
  );
  let pkgs = selected as PackageId[];
  if (pkgs.length === 0) {
    p.log.warn("No packages selected — monorepo will only contain apps/web.");
  }
  pkgs = ensureTypescriptWithDesignSystem(pkgs);
  return pkgs;
};

const readCodeQuality = async (
  options: CreateCommandOptions,
  ultraciteOn: boolean,
): Promise<CodeQualityId | undefined> => {
  if (!ultraciteOn) {
    if (options.codeQuality !== undefined && options.codeQuality.length > 0) {
      throw new Error("--code-quality requires ultracite in --addons.");
    }
    return undefined;
  }
  if (options.codeQuality !== undefined && options.codeQuality.length > 0) {
    const v = options.codeQuality;
    if (!isCodeQualityId(v)) {
      throw new Error(`Invalid --code-quality. Use: ${CODE_QUALITY_IDS.join(" | ")}`);
    }
    return v;
  }
  const initial = "oxlint-oxfmt" satisfies CodeQualityId;
  const q = assertValue(
    await p.select<CodeQualityId>({
      initialValue: initial,
      message: "Preferred Ultracite stack (summary only; ultracite init will prompt too)",
      options: [
        { hint: "Biome", label: "Biome", value: "biome" },
        { hint: "Oxlint + Oxfmt (Verno default)", label: "Oxlint + Oxfmt", value: "oxlint-oxfmt" },
        { hint: "ESLint + Prettier", label: "ESLint + Prettier", value: "eslint-prettier" },
      ],
    }),
  );
  return q;
};

const readPackageManager = async (options: CreateCommandOptions): Promise<PackageManager> => {
  const raw = options.packageManager;
  if (raw) {
    if (!isPackageManager(raw)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    return raw;
  }
  const pm = assertValue(
    await p.select({
      initialValue: "bun" satisfies PackageManager,
      message: "Package manager",
      options: PM_SELECT_OPTIONS,
    }),
  );
  return isPackageManager(pm) ? pm : "bun";
};

const readUiMode = async (
  hasSkipShadcn: boolean,
  options: CreateCommandOptions,
): Promise<UiMode> => {
  if (hasSkipShadcn) {
    return "none";
  }
  if (options.ui) {
    if (!isUiMode(options.ui)) {
      throw new Error("Invalid --ui. Use: shadcn | none");
    }
    return options.ui;
  }
  const u = assertValue(
    await p.select({
      initialValue: "shadcn" satisfies UiMode,
      message: "UI",
      options: [
        { hint: "run shadcn bootstrap after install", label: "shadcn", value: "shadcn" },
        { label: "none", value: "none" },
      ],
    }),
  );
  return isUiMode(u) ? u : "shadcn";
};

const readShadcnPreset = async (options: CreateCommandOptions, ui: UiMode): Promise<string> => {
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
    message: "Install dependencies now?",
  });
  exitOnCancel(c);
  return Boolean(c);
};

const readDoGit = async (hasNoGit: boolean): Promise<boolean> => {
  if (hasNoGit) {
    return false;
  }
  const c = await p.confirm({
    initialValue: true,
    message: "Initialize a git repository?",
  });
  exitOnCancel(c);
  return Boolean(c);
};

const addonsSummary = (addons: readonly AddonId[]): string =>
  addons.length > 0 ? addons.join(", ") : "none";

const packagesSummary = (pkgs: readonly PackageId[], turborepoOn: boolean): string => {
  if (!turborepoOn) {
    return "—";
  }
  return pkgs.length > 0 ? pkgs.join(", ") : "none";
};

export const runInteractiveCreateWizard = async (args: {
  readonly name?: string;
  readonly options: CreateCommandOptions;
}): Promise<ResolvedCreateInputs> => {
  const { name: positionalName, options } = args;
  const hasNoInstall = options.noInstall;
  const hasNoGit = options.noGit;
  const hasSkipShadcn = options.skipShadcn;
  const isDryRun = options.dryRun;

  renderVernoTitle(false);
  p.intro(pc.magenta("Creating a new Verno Studio project"));
  p.log.info("This wizard will guide you through a new project. Use arrow keys, Enter, and y/n.");

  p.log.step("Project — name and folder");
  const name = await readProjectName(positionalName);

  p.log.step("Stack — add-ons and packages");
  const addons = await readAddonsInteractive(options);
  const turborepoOn = addons.includes("turborepo");
  const packages = await readPackagesInteractive(options, turborepoOn);
  const ultraciteOn = addons.includes("ultracite");
  const codeQuality = await readCodeQuality(options, ultraciteOn);

  p.log.step("Tooling — package manager and UI");
  const packageManager = await readPackageManager(options);
  const ui = await readUiMode(hasSkipShadcn, options);
  const shadcnPreset = await readShadcnPreset(options, ui);

  p.log.step("Post-create — install and git");
  const doInstall = await readDoInstall(hasNoInstall);
  const doGit = await readDoGit(hasNoGit);

  const useShadcn = ui === "shadcn" && !hasSkipShadcn;
  const runUltracite = ultraciteOn;

  const summaryLines: string[] = [
    `Name:           ${name}`,
    `Frontend:       Next.js`,
    `Add-ons:        ${addonsSummary(addons)}`,
    `Packages:       ${packagesSummary(packages, turborepoOn)}`,
    `Code quality:   ${codeQuality ?? "—"}`,
    `Package mgr:    ${packageManager}`,
    `UI:             ${useShadcn ? `shadcn (preset: ${shadcnPreset})` : "none"}`,
    `Install:        ${doInstall ? "yes" : "no"}`,
    `Ultracite init: ${runUltracite ? "yes (after install)" : "no"}`,
    `git:            ${doGit ? "yes" : "no"}`,
  ];
  if (isDryRun) {
    summaryLines.push("Mode:           dry run (no files will be written)");
  }

  p.log.step("Review — confirm to continue");
  p.note(summaryLines.join("\n"), "Summary");

  const proceed = await p.confirm({
    initialValue: true,
    message: isDryRun ? "Show the plan? (dry run only)" : "Create project at this name now?",
  });
  exitOnCancel(proceed);
  if (!proceed) {
    throw new UserCancelledError("Aborted on confirmation.");
  }

  return {
    addons,
    codeQuality,
    doGit,
    doInstall,
    frontend: "next",
    name,
    nonInteractive: false,
    packageManager,
    packages,
    runUltracite,
    shadcnPreset,
    ui,
    useShadcn,
  };
};
