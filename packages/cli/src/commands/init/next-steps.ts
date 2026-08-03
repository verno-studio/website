import type { PackageManager } from "@vernostudio/template-generator";
import { devCommand, installCommand, shadcnRunner } from "../shared/pm-commands";
import type { ResolvedInitInputs } from "./args";
import type { DetectedState } from "./actions";

export const getNextSteps = (args: {
  readonly doInstall: boolean;
  readonly packageManager: PackageManager;
  readonly useShadcn: boolean;
  readonly runUltracite: boolean;
  readonly monorepo: boolean;
  readonly needsRestructure: boolean;
}): string[] => {
  const { doInstall, packageManager, useShadcn, runUltracite, monorepo, needsRestructure } = args;
  const steps: string[] = [];

  if (needsRestructure) {
    steps.push("Note: Your project was restructured for turborepo (apps/web/, packages/).");
  }

  if (doInstall) {
    steps.push("Dependencies were installed.");
  } else {
    steps.push(`Run: ${installCommand(packageManager)}`);
  }

  if (monorepo) {
    steps.push(`Start the monorepo: ${devCommand(packageManager)}`);
  } else {
    steps.push(`Start the dev server: ${devCommand(packageManager)}`);
  }

  if (useShadcn) {
    const enterApp = monorepo ? "cd apps/web && " : "";
    steps.push(
      `To switch shadcn preset later: ${enterApp}${shadcnRunner(packageManager)} apply --preset <code>`,
    );
  }

  if (runUltracite) {
    steps.push("Ultracite is active — see https://www.ultracite.ai for configuration.");
  }

  steps.push("See https://verno-studio.vercel.app for more about Verno Studio.");
  return steps;
};

export const getNextStepHints = (
  resolved: ResolvedInitInputs,
  detected: DetectedState,
): string[] => {
  const needsRestructure = resolved.addons.includes("turborepo") && !detected.isMonorepo;
  const monorepo = detected.isMonorepo || resolved.addons.includes("turborepo");

  return getNextSteps({
    doInstall: resolved.doInstall,
    monorepo,
    needsRestructure,
    packageManager: resolved.packageManager,
    runUltracite: resolved.runUltracite,
    useShadcn: resolved.useShadcn,
  });
};
