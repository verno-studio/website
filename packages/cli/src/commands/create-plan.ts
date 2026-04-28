import { join } from "node:path";
import type { AddonId, FrontendId, PackageId, PackageManager } from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../pm-exec";
import type { ResolvedCreateInputs } from "./create-args";
import { resolvedHasDesignSystem } from "./create-args";

export const getShadcnWorkingDirectory = (
  projectDir: string,
  monorepoWithDesignSystem: boolean,
): string =>
  monorepoWithDesignSystem ? join(projectDir, "packages", "design-system") : projectDir;

export type CreateStepId = "scaffold" | "install" | "shadcn" | "shadcn-all" | "ultracite" | "git";

export interface CreateCommandSpec {
  file: string;
  args: readonly string[];
  cwd: string;
}

export interface CreateStepPlan {
  id: CreateStepId;
  label: string;
  willRun: boolean;
  command?: CreateCommandSpec;
  skippedReason?: string;
}

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
  steps: readonly {
    id: string;
    label: string;
    willRun: boolean;
    command?: { file: string; args: readonly string[]; cwd: string };
    skippedReason?: string;
  }[];
}

export const toPlanSummaryJson = (p: {
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
  steps: readonly CreateStepPlan[];
}): CreatePlanSummary => ({
  addons: p.addons,
  doGit: p.doGit,
  doInstall: p.doInstall,
  frontend: p.frontend,
  packageManager: p.packageManager,
  packages: p.packages,
  projectDir: p.projectDir,
  projectName: p.projectName,
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

export const buildCreatePlan = (
  resolved: ResolvedCreateInputs,
  projectDir: string,
): {
  readonly steps: CreateStepPlan[];
} => {
  const steps: CreateStepPlan[] = [
    { id: "scaffold", label: "Scaffold project files from template", willRun: true },
  ];

  if (resolved.doInstall) {
    const { args: installArgs, file } = getPmInstallCommand(resolved.packageManager);
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

  if (resolved.useShadcn) {
    const monorepoWithDesignSystem = resolvedHasDesignSystem(resolved);
    const sh = getShadcnBootstrapCommand(resolved.packageManager, {
      monorepoWithDesignSystem,
      preset: resolved.shadcnPreset,
    });
    const addAll = getShadcnAddAllCommand(resolved.packageManager, { monorepoWithDesignSystem });
    steps.push({
      command: { args: sh.args, cwd: projectDir, file: sh.file },
      id: "shadcn",
      label: "Run shadcn init",
      willRun: true,
    });
    steps.push({
      command: { args: addAll.args, cwd: projectDir, file: addAll.file },
      id: "shadcn-all",
      label: "Run shadcn add --all (registry UI components)",
      willRun: true,
    });
  } else {
    steps.push({
      id: "shadcn",
      label: "Run shadcn init",
      skippedReason: "Skipped (--ui none, --skip-shadcn, or declined)",
      willRun: false,
    });
    steps.push({
      id: "shadcn-all",
      label: "Run shadcn add --all",
      skippedReason: "Skipped (--ui none, --skip-shadcn, or declined)",
      willRun: false,
    });
  }

  if (resolved.runUltracite) {
    const u = getUltraciteInitCommand(
      resolved.packageManager,
      resolved.nonInteractive ? "quiet" : "interactive",
      { linter: resolved.ultraciteLinter },
    );
    steps.push({
      command: { args: u.args, cwd: projectDir, file: u.file },
      id: "ultracite",
      label: "Run ultracite init",
      willRun: true,
    });
  } else {
    steps.push({
      id: "ultracite",
      label: "Run ultracite init",
      skippedReason: "Skipped (ultracite add-on off, --skip-ultracite, or declined)",
      willRun: false,
    });
  }

  if (resolved.doGit) {
    steps.push({
      id: "git",
      label: "Initialize git repository and create initial commit (Verno Studio)",
      willRun: true,
    });
  } else {
    steps.push({
      id: "git",
      label: "Initialize git repository and create initial commit (Verno Studio)",
      skippedReason: "Skipped (--no-git or declined in wizard)",
      willRun: false,
    });
  }

  return { steps };
};

export const getPlanSummary = (
  resolved: ResolvedCreateInputs,
  projectDir: string,
  steps: readonly CreateStepPlan[],
) =>
  toPlanSummaryJson({
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
    steps,
    useShadcn: resolved.useShadcn,
  });
