import { join } from "node:path";
import type { PackageManager, TemplateId } from "@verno/template-generator";
import {
  getPmInstallCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../pm-exec";
import type { ResolvedCreateInputs } from "./create-args";

export const getShadcnWorkingDirectory = (projectDir: string, template: TemplateId): string =>
  template === "next-turborepo" ? join(projectDir, "packages", "design-system") : projectDir;

export type CreateStepId = "scaffold" | "install" | "shadcn" | "ultracite" | "git";

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
  template: TemplateId;
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
  template: TemplateId;
  packageManager: PackageManager;
  doInstall: boolean;
  doGit: boolean;
  runUltracite: boolean;
  useShadcn: boolean;
  shadcnPreset: string;
  steps: readonly CreateStepPlan[];
}): CreatePlanSummary => ({
  doGit: p.doGit,
  doInstall: p.doInstall,
  packageManager: p.packageManager,
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
  template: p.template,
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
    const sh = getShadcnBootstrapCommand(resolved.packageManager, {
      preset: resolved.shadcnPreset,
      template: resolved.template,
    });
    const cwd = getShadcnWorkingDirectory(projectDir, resolved.template);
    steps.push({
      command: { args: sh.args, cwd, file: sh.file },
      id: "shadcn",
      label: "Run shadcn init",
      willRun: true,
    });
  } else {
    steps.push({
      id: "shadcn",
      label: "Run shadcn init",
      skippedReason: "Skipped (--ui none, --skip-shadcn, or declined)",
      willRun: false,
    });
  }

  if (resolved.runUltracite) {
    const u = getUltraciteInitCommand(
      resolved.packageManager,
      resolved.nonInteractive ? "quiet" : "interactive",
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
      skippedReason: "Skipped (--skip-ultracite or declined in wizard)",
      willRun: false,
    });
  }

  if (resolved.doGit) {
    steps.push({
      command: { args: ["init"], cwd: projectDir, file: "git" },
      id: "git",
      label: "Initialize git repository",
      willRun: true,
    });
  } else {
    steps.push({
      id: "git",
      label: "Initialize git repository",
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
    doGit: resolved.doGit,
    doInstall: resolved.doInstall,
    packageManager: resolved.packageManager,
    projectDir,
    projectName: resolved.name,
    runUltracite: resolved.runUltracite,
    shadcnPreset: resolved.shadcnPreset,
    steps,
    template: resolved.template,
    useShadcn: resolved.useShadcn,
  });
