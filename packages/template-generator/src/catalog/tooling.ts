import type { PackageManager, ProjectConfig } from "../config";

export const TOOLING = {
  packageManagerVersions: {
    bun: "1.3.12",
    npm: "10.9.0",
    pnpm: "9.15.0",
  } as const satisfies Record<PackageManager, string>,
  shadcnExecPackage: "shadcn@latest" as const,
  ultraciteExecPackage: "ultracite@latest" as const,
} as const;

export const getShadcnExecSpec = (): string => TOOLING.shadcnExecPackage;

export const getUltraciteExecSpec = (): string => TOOLING.ultraciteExecPackage;

export const packageManagerField = (pm: ProjectConfig["packageManager"]): string => {
  const v = TOOLING.packageManagerVersions[pm];
  return `${pm}@${v}`;
};
