import type { PackageManager, TemplateId } from "@verno/template-generator";
import type { ResolvedCreateInputs } from "./create-args";

const devCommand = (packageManager: PackageManager): string => {
  if (packageManager === "bun") {
    return "bun run dev";
  }
  if (packageManager === "pnpm") {
    return "pnpm run dev";
  }
  return "npm run dev";
};

const installCommand = (packageManager: PackageManager): string => {
  if (packageManager === "bun") {
    return "bun install";
  }
  if (packageManager === "pnpm") {
    return "pnpm install";
  }
  return "npm install";
};

export const getNextSteps = (inputs: {
  readonly name: string;
  readonly doInstall: boolean;
  readonly packageManager: PackageManager;
  readonly template: TemplateId;
}): string[] => {
  const { name, doInstall, packageManager, template } = inputs;
  const steps: string[] = [`cd ${name}`];
  if (!doInstall) {
    steps.push(installCommand(packageManager));
  }
  if (template === "next-turborepo") {
    steps.push(`Start the monorepo: ${devCommand(packageManager)}`);
  } else {
    steps.push(devCommand(packageManager));
  }
  return steps;
};

export const getNextStepHints = (resolved: ResolvedCreateInputs): string[] =>
  getNextSteps({
    doInstall: resolved.doInstall,
    name: resolved.name,
    packageManager: resolved.packageManager,
    template: resolved.template,
  });
