import type { PackageManager } from "@vernostudio/template-generator";
import { devCommand, installCommand, shadcnRunner } from "../shared/pm-commands";
import type { ResolvedCreateInputs } from "./args";
import { resolvedUsesTurborepo } from "./args";

export const getNextSteps = (inputs: {
  readonly name: string;
  readonly doInstall: boolean;
  readonly packageManager: PackageManager;
  readonly useShadcn: boolean;
  readonly monorepo: boolean;
}): string[] => {
  const { name, doInstall, packageManager, useShadcn, monorepo } = inputs;
  const steps: string[] = [`cd ${name}`];
  if (!doInstall) {
    steps.push(installCommand(packageManager));
  }
  if (monorepo) {
    steps.push(`Start the monorepo: ${devCommand(packageManager)}`);
  } else {
    steps.push(devCommand(packageManager));
  }
  if (useShadcn) {
    const enterApp = monorepo ? "cd apps/web && " : "";
    steps.push(
      `To switch shadcn preset later: ${enterApp}${shadcnRunner(packageManager)} apply --preset <code>`,
    );
  }
  return steps;
};

export const getNextStepHints = (resolved: ResolvedCreateInputs): string[] =>
  getNextSteps({
    doInstall: resolved.doInstall,
    monorepo: resolvedUsesTurborepo(resolved),
    name: resolved.name,
    packageManager: resolved.packageManager,
    useShadcn: resolved.useShadcn,
  });
