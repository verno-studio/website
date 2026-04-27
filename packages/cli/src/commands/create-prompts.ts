import * as p from "@clack/prompts";
import pc from "picocolors";
import type { PackageManager, TemplateId } from "@verno/template-generator";
import { UserCancelledError } from "../errors";
import { renderVernoTitle } from "../ui";
import {
  DEFAULT_SHADCN_PRESET,
  isPackageManager,
  isTemplateId,
  isUiMode,
  PACKAGE_MANAGERS,
  TEMPLATES,
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

const TEMPLATE_SELECT_OPTIONS = TEMPLATES.map((id) => {
  if (id === "next-app") {
    return { hint: "single app", label: "Next.js app", value: id } as const;
  }
  return { hint: "Next.js + shared packages", label: "Turborepo monorepo", value: id } as const;
});

const PM_SELECT_OPTIONS = PACKAGE_MANAGERS.map((pm) => ({
  hint: pm === "bun" ? "default" : undefined,
  label: pm,
  value: pm,
}));

const templateLabel = (id: TemplateId): string =>
  id === "next-app" ? "Next.js app" : "Turborepo monorepo";

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

const readTemplate = async (options: CreateCommandOptions): Promise<TemplateId> => {
  if (options.template) {
    if (!isTemplateId(options.template)) {
      throw new Error(`Invalid --template. Use: ${TEMPLATES.join(" | ")}`);
    }
    return options.template;
  }
  const t = assertValue(
    await p.select({
      initialValue: "next-app" satisfies TemplateId,
      message: "Template",
      options: TEMPLATE_SELECT_OPTIONS,
    }),
  );
  return isTemplateId(t) ? t : "next-app";
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

const readRunUltracite = async (hasSkipUltracite: boolean): Promise<boolean> => {
  if (hasSkipUltracite) {
    return false;
  }
  const c = await p.confirm({
    initialValue: true,
    message: "Run ultracite init in the new project?",
  });
  exitOnCancel(c);
  return Boolean(c);
};

export const runInteractiveCreateWizard = async (args: {
  readonly name?: string;
  readonly options: CreateCommandOptions;
}): Promise<ResolvedCreateInputs> => {
  const { name: positionalName, options } = args;
  const hasNoInstall = options.noInstall;
  const hasNoGit = options.noGit;
  const hasSkipShadcn = options.skipShadcn;
  const hasSkipUltracite = options.skipUltracite;
  const isDryRun = options.dryRun;

  renderVernoTitle(false);
  p.intro(pc.magenta("Creating a new Verno Studio project"));
  p.log.info("This wizard will guide you through a new project. Use arrow keys, Enter, and y/n.");

  p.log.step("Project — name and folder");
  const name = await readProjectName(positionalName);

  p.log.step("Stack — template and package manager");
  const template = await readTemplate(options);
  const packageManager = await readPackageManager(options);

  p.log.step("UI — shadcn and preset");
  const ui = await readUiMode(hasSkipShadcn, options);
  const shadcnPreset = await readShadcnPreset(options, ui);

  p.log.step("Post-create — install, ultracite, and git");
  const doInstall = await readDoInstall(hasNoInstall);
  const doGit = await readDoGit(hasNoGit);
  const runUltracite = await readRunUltracite(hasSkipUltracite);

  const useShadcn = ui === "shadcn" && !hasSkipShadcn;

  const summaryLines: string[] = [
    `Name:         ${name}`,
    `Template:     ${templateLabel(template)}`,
    `Package mgr:  ${packageManager}`,
    `UI:           ${useShadcn ? `shadcn (preset: ${shadcnPreset})` : "none"}`,
    `Install:      ${doInstall ? "yes" : "no"}`,
    `ultracite:   ${runUltracite ? "yes" : "no"}`,
    `git:          ${doGit ? "yes" : "no"}`,
  ];
  if (isDryRun) {
    summaryLines.push("Mode:        dry run (no files will be written)");
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
    doGit,
    doInstall,
    name,
    packageManager,
    runUltracite,
    shadcnPreset,
    template,
    ui,
    useShadcn,
  };
};
