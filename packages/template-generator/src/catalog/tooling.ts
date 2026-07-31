import type { PackageManager, ProjectConfig } from "../config";
import { getDependencyVersion } from "../utils/add-deps";

export const TOOLING = {
  packageManagerVersions: {
    bun: "1.3.12",
    npm: "10.9.0",
    pnpm: "9.15.0",
  } as const satisfies Record<PackageManager, string>,
  shadcnExecPackage: "shadcn@latest" as const,
  // Pinned to the dependency catalog so the executed CLI matches the version
  // written into generated projects; bump both via the catalog in one place.
  ultraciteExecPackage: `ultracite@${getDependencyVersion("ultracite")}`,
} as const;

export const getShadcnExecSpec = (): string => TOOLING.shadcnExecPackage;

export const getUltraciteExecSpec = (): string => TOOLING.ultraciteExecPackage;

export const packageManagerField = (pm: ProjectConfig["packageManager"]): string => {
  const v = TOOLING.packageManagerVersions[pm];
  return `${pm}@${v}`;
};

export const devScriptCommand = (pm: PackageManager): string =>
  pm === "npm" ? "npm run dev" : `${pm} dev`;
