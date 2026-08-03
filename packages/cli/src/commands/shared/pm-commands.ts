import type { PackageManager } from "@vernostudio/template-generator";

/**
 * The commands printed in next-step hints. These are strings for the user to
 * copy, not specs to spawn — `pm-exec.ts` builds those.
 */
export const shadcnRunner = (packageManager: PackageManager): string => {
  if (packageManager === "bun") {
    return "bun x shadcn@latest";
  }
  if (packageManager === "pnpm") {
    return "pnpm dlx shadcn@latest";
  }
  return "npx shadcn@latest";
};

export const devCommand = (packageManager: PackageManager): string => `${packageManager} run dev`;

export const installCommand = (packageManager: PackageManager): string =>
  `${packageManager} install`;
