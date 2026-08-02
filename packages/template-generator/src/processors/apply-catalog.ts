import type { ProjectConfig } from "../config";
import { hasAddon, hasPackage, isMonorepo } from "../config";
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

/** What the scaffolded provider imports. `shadcn add` installs its own. */
const SHADCN_UI_RUNTIME: readonly AvailableDependencies[] = ["next-themes"];

/** `lib/utils.ts` (cn) lives in the app, so its two dependencies do too. */
const SHADCN_STANDALONE_LIB_UTILS: readonly AvailableDependencies[] = ["clsx", "tailwind-merge"];

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
  const uiShadcn = config.ui === "shadcn";

  addPackageDependency({
    devDependencies: devDepsWithOptionalUltracite(config, monorepoRootSharedDevDeps),
    packagePath: "package.json",
    vfs,
  });

  const webWorkspacePins: {
    customDependencies?: Record<string, string>;
    customDevDependencies?: Record<string, string>;
  } = {};
  if (hasPackage(config, "typescript-config")) {
    webWorkspacePins.customDevDependencies = { [tsConfigName]: "workspace:*" };
  }

  const webRuntimeDependencies: AvailableDependencies[] = [...webAppDeps.dependencies];
  if (uiShadcn) {
    webRuntimeDependencies.push(...SHADCN_UI_RUNTIME, ...SHADCN_STANDALONE_LIB_UTILS);
  }

  addPackageDependency({
    ...webWorkspacePins,
    dependencies: webRuntimeDependencies,
    devDependencies: devDepsWithOptionalUltracite(config, webAppDeps.devDependencies),
    packagePath: "apps/web/package.json",
    vfs,
  });
};

export const applyDependencyCatalog = (vfs: VirtualFileSystem, config: ProjectConfig): void => {
  if (!isMonorepo(config)) {
    const dependencies: AvailableDependencies[] = [...nextAppRuntimeDeps.dependencies];
    if (config.ui === "shadcn") {
      dependencies.push(...SHADCN_UI_RUNTIME, ...SHADCN_STANDALONE_LIB_UTILS);
    }
    addPackageDependency({
      dependencies,
      devDependencies: devDepsWithOptionalUltracite(config, nextWebAppDevDependencies),
      packagePath: "package.json",
      vfs,
    });
    return;
  }
  applyMonorepoCatalog(vfs, config);
};
