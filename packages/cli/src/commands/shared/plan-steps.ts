import type { PackageManager } from "@vernostudio/template-generator";
import {
  getPmInstallCommand,
  getShadcnAddAllCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../../pm-exec";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import type { UltraciteLinterId } from "../../ultracite-linter";

export interface CommandStepSpec {
  readonly file: string;
  readonly args: readonly string[];
  readonly cwd: string;
}

export interface CommandStepPlan<TId extends string = string> {
  readonly id: TId;
  readonly label: string;
  readonly willRun: boolean;
  readonly command?: CommandStepSpec;
  readonly skippedReason?: string;
}

export const mapStepsToSummarySteps = <TId extends string>(
  steps: readonly CommandStepPlan<TId>[],
): readonly {
  id: string;
  label: string;
  willRun: boolean;
  command?: { file: string; args: readonly string[]; cwd: string };
  skippedReason?: string;
}[] =>
  steps.map((step) => ({
    command: step.command
      ? { args: step.command.args, cwd: step.command.cwd, file: step.command.file }
      : undefined,
    id: step.id,
    label: step.label,
    skippedReason: step.skippedReason,
    willRun: step.willRun,
  }));

export const appendInstallStep = <TId extends string>(
  steps: CommandStepPlan<TId>[],
  args: {
    readonly doInstall: boolean;
    readonly packageManager: PackageManager;
    readonly projectDir: string;
    readonly id: TId;
    readonly skipReason?: string;
  },
): void => {
  if (args.doInstall) {
    const { args: installArgs, file } = getPmInstallCommand(args.packageManager);
    steps.push({
      command: { args: installArgs, cwd: args.projectDir, file },
      id: args.id,
      label: "Install dependencies",
      willRun: true,
    });
    return;
  }

  steps.push({
    id: args.id,
    label: "Install dependencies",
    skippedReason: args.skipReason ?? "Skipped (--no-install or declined in wizard)",
    willRun: false,
  });
};

export type ShadcnPlanMode =
  | { readonly kind: "run"; readonly monorepoWithDesignSystem: boolean; readonly preset: string }
  | { readonly kind: "already-configured" }
  | { readonly kind: "skip"; readonly reason: string };

export const appendShadcnSteps = <TId extends string>(
  steps: CommandStepPlan<TId>[],
  args: {
    readonly mode: ShadcnPlanMode;
    readonly packageManager: PackageManager;
    readonly projectDir: string;
    readonly bootstrapId: TId;
    readonly addAllId: TId;
  },
): void => {
  if (args.mode.kind === "run") {
    const sh = getShadcnBootstrapCommand(args.packageManager, {
      monorepoWithDesignSystem: args.mode.monorepoWithDesignSystem,
      preset: args.mode.preset,
    });
    const addAll = getShadcnAddAllCommand(args.packageManager, {
      monorepoWithDesignSystem: args.mode.monorepoWithDesignSystem,
    });
    steps.push({
      command: { args: sh.args, cwd: args.projectDir, file: sh.file },
      id: args.bootstrapId,
      label: "Run shadcn init / apply",
      willRun: true,
    });
    steps.push({
      command: { args: addAll.args, cwd: args.projectDir, file: addAll.file },
      id: args.addAllId,
      label: "Run shadcn add --all (registry UI components)",
      willRun: true,
    });
    return;
  }

  const skippedReason =
    args.mode.kind === "already-configured" ? "shadcn is already configured" : args.mode.reason;

  steps.push({
    id: args.bootstrapId,
    label: "Run shadcn init / apply",
    skippedReason,
    willRun: false,
  });
  steps.push({
    id: args.addAllId,
    label: "Run shadcn add --all",
    skippedReason,
    willRun: false,
  });
};

export type UltracitePlanMode =
  | {
      readonly kind: "run";
      readonly nonInteractive: boolean;
      readonly linter?: UltraciteLinterId;
      readonly frameworks?: readonly UltraciteFrameworkId[];
    }
  | { readonly kind: "already-configured" }
  | { readonly kind: "skip"; readonly reason: string };

export const appendToggleStep = <TId extends string>(
  steps: CommandStepPlan<TId>[],
  args: {
    readonly enabled: boolean;
    readonly id: TId;
    readonly label: string;
    readonly skipReason: string;
  },
): void => {
  steps.push({
    id: args.id,
    label: args.label,
    skippedReason: args.enabled ? undefined : args.skipReason,
    willRun: args.enabled,
  });
};

export const appendUltraciteStep = <TId extends string>(
  steps: CommandStepPlan<TId>[],
  args: {
    readonly mode: UltracitePlanMode;
    readonly packageManager: PackageManager;
    readonly projectDir: string;
    readonly id: TId;
  },
): void => {
  if (args.mode.kind === "run") {
    const u = getUltraciteInitCommand(
      args.packageManager,
      args.mode.nonInteractive ? "quiet" : "interactive",
      { frameworks: args.mode.frameworks, linter: args.mode.linter },
    );
    steps.push({
      command: { args: u.args, cwd: args.projectDir, file: u.file },
      id: args.id,
      label: "Run ultracite init",
      willRun: true,
    });
    return;
  }

  const skippedReason =
    args.mode.kind === "already-configured" ? "ultracite is already configured" : args.mode.reason;

  steps.push({
    id: args.id,
    label: "Run ultracite init",
    skippedReason,
    willRun: false,
  });
};
