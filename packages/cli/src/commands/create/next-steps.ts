import type { PackageManager } from "@vernostudio/template-generator";
import type { ResolvedCreateInputs } from "./args";
import { resolvedUsesTurborepo } from "./args";

const shadcnRunner = (packageManager: PackageManager): string => {
  if (packageManager === "bun") {
    return "npx --yes shadcn@latest";
  }
  if (packageManager === "pnpm") {
    return "pnpm dlx shadcn@latest";
  }
  return "npx shadcn@latest";
};

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
    const sh = shadcnRunner(packageManager);
    const dir = monorepo ? "apps/web" : ".";
    steps.push(`To switch shadcn preset later: cd ${dir} && ${sh} apply --preset <code>`);
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
