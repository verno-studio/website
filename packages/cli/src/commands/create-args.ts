import { parseArgs } from "node:util";
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

export interface CreateCliValues {
  readonly help: boolean;
  readonly "dry-run": boolean;
  readonly json: boolean;
  readonly "no-git": boolean;
  readonly "no-install": boolean;
  readonly "package-manager"?: string;
  readonly "shadcn-preset"?: string;
  readonly "skip-shadcn": boolean;
  readonly "skip-ultracite": boolean;
  readonly template?: string;
  readonly ui?: string;
  readonly yes: boolean;
}

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

export const parseCreateArgv = (argv: string[]) => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    args: argv,
    options: {
      "dry-run": { default: false, type: "boolean" },
      help: { default: false, short: "h", type: "boolean" },
      json: { default: false, type: "boolean" },
      "no-git": { default: false, type: "boolean" },
      "no-install": { default: false, type: "boolean" },
      "package-manager": { short: "p", type: "string" },
      "shadcn-preset": { type: "string" },
      "skip-shadcn": { default: false, type: "boolean" },
      "skip-ultracite": { default: false, type: "boolean" },
      template: { short: "T", type: "string" },
      ui: { type: "string" },
      yes: { default: false, short: "y", type: "boolean" },
    },
    strict: true,
  });
  return { positionals, values };
};

export const resolveCreateInputsNonInteractive = (
  positionals: readonly string[],
  values: CreateCliValues,
): ResolvedCreateInputs => {
  const [first] = positionals;
  if (!first) {
    throw new Error("Project name is required. Example: verno create my-app -y");
  }
  const name = first;

  let template: TemplateId;
  if (values.template) {
    if (!isTemplateId(values.template)) {
      throw new Error(`Invalid --template. Use: ${TEMPLATES.join(" | ")}`);
    }
    ({ template } = values);
  } else {
    template = "next-app";
  }

  let packageManager: PackageManager;
  const rawPackageManager = values["package-manager"];
  if (rawPackageManager) {
    if (!isPackageManager(rawPackageManager)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    packageManager = rawPackageManager;
  } else {
    packageManager = "bun";
  }

  let ui: UiMode;
  if (values.ui) {
    if (!isUiMode(values.ui)) {
      throw new Error("Invalid --ui. Use: shadcn | none");
    }
    ({ ui } = values);
  } else {
    ui = "shadcn";
  }
  if (values["skip-shadcn"]) {
    ui = "none";
  }
  return {
    doGit: !values["no-git"],
    doInstall: !values["no-install"],
    name,
    packageManager,
    runUltracite: !values["skip-ultracite"],
    shadcnPreset: values["shadcn-preset"] ?? DEFAULT_SHADCN_PRESET,
    template,
    ui,
    useShadcn: ui === "shadcn" && !values["skip-shadcn"],
  };
};
