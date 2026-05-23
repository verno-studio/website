import type {
  AddonId,
  FrontendId,
  PackageId,
  PackageManager,
} from "@vernostudio/template-generator";
import type { ResolvedCreateInputs } from "./args";
import { resolvedHasDesignSystem } from "./args";
import {
  appendInstallStep,
  appendShadcnSteps,
  appendToggleStep,
  appendUltraciteStep,
  mapStepsToSummarySteps,
} from "../shared/plan-steps";
import type { CommandStepPlan } from "../shared/plan-steps";

export type CreateStepId = "scaffold" | "install" | "shadcn" | "shadcn-all" | "ultracite" | "git";

export type CreateStepPlan = CommandStepPlan<CreateStepId>;

export interface CreatePlanSummary {
  projectName: string;
  projectDir: string;
  frontend: FrontendId;
  addons: readonly AddonId[];
  packages: readonly PackageId[];
  packageManager: PackageManager;
  doInstall: boolean;
  doGit: boolean;
  runUltracite: boolean;
  useShadcn: boolean;
  shadcnPreset: string;
  steps: ReturnType<typeof mapStepsToSummarySteps>;
}

export const buildCreatePlan = (
  resolved: ResolvedCreateInputs,
  projectDir: string,
): {
  readonly steps: CreateStepPlan[];
} => {
  const steps: CreateStepPlan[] = [
    { id: "scaffold", label: "Scaffold project files from template", willRun: true },
  ];

  appendInstallStep(steps, {
    doInstall: resolved.doInstall,
    id: "install",
    packageManager: resolved.packageManager,
    projectDir,
  });

  appendShadcnSteps(steps, {
    addAllId: "shadcn-all",
    bootstrapId: "shadcn",
    mode: resolved.useShadcn
      ? {
          kind: "run",
          monorepoWithDesignSystem: resolvedHasDesignSystem(resolved),
          preset: resolved.shadcnPreset,
        }
      : { kind: "skip", reason: "Skipped (--ui none, --skip-shadcn, or declined)" },
    packageManager: resolved.packageManager,
    projectDir,
  });

  appendUltraciteStep(steps, {
    id: "ultracite",
    mode: resolved.runUltracite
      ? { kind: "run", linter: resolved.ultraciteLinter, nonInteractive: resolved.nonInteractive }
      : { kind: "skip", reason: "Skipped (ultracite add-on off, --skip-ultracite, or declined)" },
    packageManager: resolved.packageManager,
    projectDir,
  });

  appendToggleStep(steps, {
    enabled: resolved.doGit,
    id: "git",
    label: "Initialize git repository and create initial commit (Verno Studio)",
    skipReason: "Skipped (--no-git or declined in wizard)",
  });

  return { steps };
};

export const getPlanSummary = (
  resolved: ResolvedCreateInputs,
  projectDir: string,
  steps: readonly CreateStepPlan[],
): CreatePlanSummary => ({
  addons: resolved.addons,
  doGit: resolved.doGit,
  doInstall: resolved.doInstall,
  frontend: resolved.frontend,
  packageManager: resolved.packageManager,
  packages: resolved.packages,
  projectDir,
  projectName: resolved.name,
  runUltracite: resolved.runUltracite,
  shadcnPreset: resolved.shadcnPreset,
  steps: mapStepsToSummarySteps(steps),
  useShadcn: resolved.useShadcn,
});
