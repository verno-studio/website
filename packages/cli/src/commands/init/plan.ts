import type { AddonId, PackageManager } from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../../pm-exec";
import type { ResolvedInitInputs } from "./args";

export type InitStepId =
  | "install"
  | "restructure"
  | "shadcn"
  | "shadcn-all"
  | "ultracite"
  | "write-manifest";

export interface InitCommandSpec {
  file: string;
  args: readonly string[];
  cwd: string;
}

export interface InitStepPlan {
  id: InitStepId;
  label: string;
  willRun: boolean;
  command?: InitCommandSpec;
  skippedReason?: string;
}

export interface InitPlanSummary {
  addons: readonly AddonId[];
  doInstall: boolean;
  packageManager: PackageManager;
  runUltracite: boolean;
  useShadcn: boolean;
  shadcnPreset: string;
  isMonorepo: boolean;
  hasShadcn: boolean;
  hasUltracite: boolean;
  steps: readonly {
    id: string;
    label: string;
    willRun: boolean;
    command?: { file: string; args: readonly string[]; cwd: string };
    skippedReason?: string;
  }[];
}

export const toInitPlanSummaryJson = (p: {
  addons: readonly AddonId[];
  doInstall: boolean;
  packageManager: PackageManager;
  runUltracite: boolean;
  useShadcn: boolean;
  shadcnPreset: string;
  isMonorepo: boolean;
  hasShadcn: boolean;
  hasUltracite: boolean;
  steps: readonly InitStepPlan[];
}): InitPlanSummary => ({
  addons: p.addons,
  doInstall: p.doInstall,
  hasShadcn: p.hasShadcn,
  hasUltracite: p.hasUltracite,
  isMonorepo: p.isMonorepo,
  packageManager: p.packageManager,
  runUltracite: p.runUltracite,
  shadcnPreset: p.shadcnPreset,
  steps: p.steps.map((s) => ({
    command: s.command
      ? { args: s.command.args, cwd: s.command.cwd, file: s.command.file }
      : undefined,
    id: s.id,
    label: s.label,
    skippedReason: s.skippedReason,
    willRun: s.willRun,
  })),
  useShadcn: p.useShadcn,
});

/**
 * Build the ordered list of steps for `vero init`.
 * Takes into account what's already detected in the project.
 */
export const buildInitPlan = (
  resolved: ResolvedInitInputs,
  detected: {
    readonly isMonorepo: boolean;
    readonly hasShadcn: boolean;
    readonly hasUltracite: boolean;
    readonly packageManager: PackageManager | null;
  },
  projectDir: string,
): {
  readonly steps: InitStepPlan[];
} => {
  const steps: InitStepPlan[] = [];
  const pm = resolved.packageManager;

  if (resolved.doInstall) {
    const { args: installArgs, file } = getPmInstallCommand(pm);
    steps.push({
      command: { args: installArgs, cwd: projectDir, file },
      id: "install",
      label: "Install dependencies",
      willRun: true,
    });
  } else {
    steps.push({
      id: "install",
      label: "Install dependencies",
      skippedReason: "Skipped (--no-install or declined in wizard)",
      willRun: false,
    });
  }

  const needsRestructure = resolved.addons.includes("turborepo") && !detected.isMonorepo;
  if (needsRestructure) {
    steps.push({
      id: "restructure",
      label: "Restructure project for turborepo monorepo layout",
      willRun: true,
    });
  }

  const needsShadcn = resolved.useShadcn && !detected.hasShadcn;
  if (needsShadcn) {
    const monorepoWithDesignSystem = resolved.addons.includes("turborepo");
    const sh = getShadcnBootstrapCommand(pm, {
      monorepoWithDesignSystem,
      preset: resolved.shadcnPreset,
    });
    const addAll = getShadcnAddAllCommand(pm, { monorepoWithDesignSystem });
    steps.push({
      command: { args: sh.args, cwd: projectDir, file: sh.file },
      id: "shadcn",
      label: "Run shadcn init / apply",
      willRun: true,
    });
    steps.push({
      command: { args: addAll.args, cwd: projectDir, file: addAll.file },
      id: "shadcn-all",
      label: "Run shadcn add --all (registry UI components)",
      willRun: true,
    });
  } else if (resolved.useShadcn && detected.hasShadcn) {
    steps.push({
      id: "shadcn",
      label: "Run shadcn init / apply",
      skippedReason: "shadcn is already configured",
      willRun: false,
    });
    steps.push({
      id: "shadcn-all",
      label: "Run shadcn add --all",
      skippedReason: "shadcn is already configured",
      willRun: false,
    });
  } else {
    steps.push({
      id: "shadcn",
      label: "Run shadcn init / apply",
      skippedReason: "Skipped (--ui none or --skip-shadcn)",
      willRun: false,
    });
    steps.push({
      id: "shadcn-all",
      label: "Run shadcn add --all",
      skippedReason: "Skipped (--ui none or --skip-shadcn)",
      willRun: false,
    });
  }

  const needsUltracite = resolved.runUltracite && !detected.hasUltracite;
  if (needsUltracite) {
    const u = getUltraciteInitCommand(pm, resolved.nonInteractive ? "quiet" : "interactive", {
      linter: resolved.ultraciteLinter,
    });
    steps.push({
      command: { args: u.args, cwd: projectDir, file: u.file },
      id: "ultracite",
      label: "Run ultracite init",
      willRun: true,
    });
  } else if (resolved.runUltracite && detected.hasUltracite) {
    steps.push({
      id: "ultracite",
      label: "Run ultracite init",
      skippedReason: "ultracite is already configured",
      willRun: false,
    });
  } else {
    steps.push({
      id: "ultracite",
      label: "Run ultracite init",
      skippedReason: "Skipped (ultracite not in addons or --skip-ultracite)",
      willRun: false,
    });
  }

  steps.push({
    id: "write-manifest",
    label: "Write .verno/manifest.json",
    willRun: true,
  });

  return { steps };
};

export const getInitPlanSummary = (
  resolved: ResolvedInitInputs,
  detected: {
    readonly isMonorepo: boolean;
    readonly hasShadcn: boolean;
    readonly hasUltracite: boolean;
  },
  projectDir: string,
  steps: readonly InitStepPlan[],
) =>
  toInitPlanSummaryJson({
    addons: resolved.addons,
    doInstall: resolved.doInstall,
    hasShadcn: detected.hasShadcn,
    hasUltracite: detected.hasUltracite,
    isMonorepo: detected.isMonorepo,
    packageManager: resolved.packageManager,
    runUltracite: resolved.runUltracite,
    shadcnPreset: resolved.shadcnPreset,
    steps,
    useShadcn: resolved.useShadcn,
  });
