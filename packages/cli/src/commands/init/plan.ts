import type { AddonId, PackageManager } from "@vernostudio/template-generator";
import type { ResolvedInitInputs } from "./args";
import {
  appendInstallStep,
  appendShadcnSteps,
  appendUltraciteStep,
  mapStepsToSummarySteps,
} from "../shared/plan-steps";
import type { CommandStepPlan, ShadcnPlanMode, UltracitePlanMode } from "../shared/plan-steps";

const resolveInitShadcnMode = (
  resolved: ResolvedInitInputs,
  detected: { readonly hasShadcn: boolean },
): ShadcnPlanMode => {
  if (resolved.useShadcn && !detected.hasShadcn) {
    return {
      kind: "run",
      monorepoWithDesignSystem: resolved.addons.includes("turborepo"),
      preset: resolved.shadcnPreset,
    };
  }
  if (resolved.useShadcn && detected.hasShadcn) {
    return { kind: "already-configured" };
  }
  return { kind: "skip", reason: "Skipped (--ui none or --skip-shadcn)" };
};

const resolveInitUltraciteMode = (
  resolved: ResolvedInitInputs,
  detected: { readonly hasUltracite: boolean },
): UltracitePlanMode => {
  if (resolved.runUltracite && !detected.hasUltracite) {
    return {
      frameworks: resolved.ultraciteFrameworks,
      kind: "run",
      linter: resolved.ultraciteLinter,
      nonInteractive: resolved.nonInteractive,
    };
  }
  if (resolved.runUltracite && detected.hasUltracite) {
    return { kind: "already-configured" };
  }
  return { kind: "skip", reason: "Skipped (ultracite not in addons or --skip-ultracite)" };
};

export type InitStepId =
  | "install"
  | "restructure"
  | "shadcn"
  | "shadcn-all"
  | "ultracite"
  | "write-manifest";

export type InitStepPlan = CommandStepPlan<InitStepId>;

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
  steps: ReturnType<typeof mapStepsToSummarySteps>;
}

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

  appendInstallStep(steps, {
    doInstall: resolved.doInstall,
    id: "install",
    packageManager: resolved.packageManager,
    projectDir,
  });

  const needsRestructure = resolved.addons.includes("turborepo") && !detected.isMonorepo;
  if (needsRestructure) {
    steps.push({
      id: "restructure",
      label: "Restructure project for turborepo monorepo layout",
      willRun: true,
    });
  }

  appendShadcnSteps(steps, {
    addAllId: "shadcn-all",
    bootstrapId: "shadcn",
    mode: resolveInitShadcnMode(resolved, detected),
    packageManager: resolved.packageManager,
    projectDir,
  });

  appendUltraciteStep(steps, {
    id: "ultracite",
    mode: resolveInitUltraciteMode(resolved, detected),
    packageManager: resolved.packageManager,
    projectDir,
  });

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
  _projectDir: string,
  steps: readonly InitStepPlan[],
): InitPlanSummary => ({
  addons: resolved.addons,
  doInstall: resolved.doInstall,
  hasShadcn: detected.hasShadcn,
  hasUltracite: detected.hasUltracite,
  isMonorepo: detected.isMonorepo,
  packageManager: resolved.packageManager,
  runUltracite: resolved.runUltracite,
  shadcnPreset: resolved.shadcnPreset,
  steps: mapStepsToSummarySteps(steps),
  useShadcn: resolved.useShadcn,
});
