import type { PackageManager } from "@vernostudio/template-generator";
import type { ResolvedCreateInputs } from "./args";
import { resolvedHasDesignSystem, resolvedUsesTurborepo } from "./args";

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
  readonly hasDesignSystem: boolean;
}): string[] => {
  const { name, doInstall, packageManager, useShadcn, monorepo, hasDesignSystem } = inputs;
  const steps: string[] = [`cd ${name}`];
  if (!doInstall) {
    steps.push(installCommand(packageManager));
  }
  if (monorepo) {
    steps.push(`Start the monorepo: ${devCommand(packageManager)}`);
  } else {
    steps.push(devCommand(packageManager));
  }
  if (useShadcn && monorepo && hasDesignSystem) {
    const sh = shadcnRunner(packageManager);
    const ds = "packages/design-system";
    steps.push(`To switch shadcn preset later: cd ${ds} && ${sh} apply --preset <code>`);
  }
  return steps;
};

export const getNextStepHints = (resolved: ResolvedCreateInputs): string[] =>
  getNextSteps({
    doInstall: resolved.doInstall,
    hasDesignSystem: resolvedHasDesignSystem(resolved),
    monorepo: resolvedUsesTurborepo(resolved),
    name: resolved.name,
    packageManager: resolved.packageManager,
    useShadcn: resolved.useShadcn,
  });
