import type { ProjectConfig } from "../config";
import { hasAddon, hasDesignSystem, hasPackage, isMonorepo } from "../config";
import type { VirtualFileSystem } from "../core/virtual-fs";
import { scoped } from "../paths";
import { addPackageDependency } from "../utils/add-deps";
import type { AvailableDependencies } from "../utils/add-deps";

const nextAppRuntimeDeps: { dependencies: readonly AvailableDependencies[] } = {
  dependencies: ["next", "react", "react-dom"],
};

/** Shared by single-app root and `apps/web` in the Turborepo layout. */
const nextWebAppDevDependencies: readonly AvailableDependencies[] = [
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@typescript/native-preview",
  "tailwindcss",
  "typescript",
];

const monorepoRootSharedDevDeps: readonly AvailableDependencies[] = ["turbo", "typescript"];

const webAppDeps: {
  dependencies: readonly AvailableDependencies[];
  devDependencies: readonly AvailableDependencies[];
} = {
  dependencies: ["next", "react", "react-dom"],
  devDependencies: nextWebAppDevDependencies,
};

const designSystemDeps: {
  dependencies: readonly AvailableDependencies[];
  devDependencies: readonly AvailableDependencies[];
  peerDependencies: readonly AvailableDependencies[];
} = {
  dependencies: [
    "class-variance-authority",
    "clsx",
    "radix-ui",
    "tailwind-merge",
    "tailwindcss",
    "tw-animate-css",
  ],
  devDependencies: [
    "@types/react",
    "@types/react-dom",
    "@typescript/native-preview",
    "shadcn",
    "typescript",
  ],
  peerDependencies: ["react", "react-dom"],
};

const devDepsWithOptionalUltracite = (
  config: ProjectConfig,
  base: readonly AvailableDependencies[],
): readonly AvailableDependencies[] => {
  if (!hasAddon(config, "ultracite")) {
    return base;
  }
  return [...base, "ultracite"];
};

const applyMonorepoCatalog = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  const tsConfigName = scoped(config.npmScope, "typescript-config");
  const dsName = scoped(config.npmScope, "design-system");

  addPackageDependency({
    devDependencies: devDepsWithOptionalUltracite(config, monorepoRootSharedDevDeps),
    packagePath: "package.json",
    vfs,
  });

  const webWorkspacePins: {
    customDependencies?: Record<string, string>;
    customDevDependencies?: Record<string, string>;
  } = {};
  if (hasDesignSystem(config)) {
    webWorkspacePins.customDependencies = { [dsName]: "workspace:*" };
  }
  if (hasPackage(config, "typescript-config")) {
    webWorkspacePins.customDevDependencies = { [tsConfigName]: "workspace:*" };
  }

  addPackageDependency({
    ...webWorkspacePins,
    dependencies: webAppDeps.dependencies,
    devDependencies: devDepsWithOptionalUltracite(config, webAppDeps.devDependencies),
    packagePath: "apps/web/package.json",
    vfs,
  });

  if (hasDesignSystem(config)) {
    addPackageDependency({
      customDevDependencies: { [tsConfigName]: "workspace:*" },
      dependencies: designSystemDeps.dependencies,
      devDependencies: designSystemDeps.devDependencies,
      packagePath: "packages/design-system/package.json",
      peerDependencies: designSystemDeps.peerDependencies,
      vfs,
    });
  }
};

export const applyDependencyCatalog = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  if (!isMonorepo(config)) {
    addPackageDependency({
      dependencies: nextAppRuntimeDeps.dependencies,
      devDependencies: devDepsWithOptionalUltracite(config, nextWebAppDevDependencies),
      packagePath: "package.json",
      vfs,
    });
    return;
  }
  applyMonorepoCatalog(vfs, config);
};
