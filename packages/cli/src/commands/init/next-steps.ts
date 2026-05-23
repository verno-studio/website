import type { PackageManager } from "@vernostudio/template-generator";
import type { ResolvedInitInputs } from "./args";
import type { DetectedState } from "./actions";

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
    const sh = shadcnRunner(packageManager);
    if (monorepo) {
      steps.push(
        `To switch shadcn preset later: cd packages/design-system && ${sh} apply --preset <code>`,
      );
    } else {
      steps.push(`To switch shadcn preset later: ${sh} apply --preset <code>`);
    }
  }

  if (runUltracite) {
    steps.push(
      "Ultracite is active — see https://vernostudio.dev/docs/ultracite for configuration.",
    );
  }

  steps.push("See https://vernostudio.dev/docs/init for more configuration options.");
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
