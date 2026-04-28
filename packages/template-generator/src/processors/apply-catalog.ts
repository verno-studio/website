import type { ProjectConfig } from "../config";
import { hasAddon, hasDesignSystem, hasPackage, isMonorepo } from "../config";
import {
  mergeDependenciesFromCatalog,
  parsePackageJson,
  stringifyPackageJson,
} from "../catalog/package-json";
import { scoped } from "../paths";
import type { FileTree } from "../paths";
import type { ManagedDependency } from "../catalog/dependencies";

const withPackageJson = (
  tree: FileTree,
  relPath: string,
  fn: (pkg: Record<string, unknown>) => void,
): FileTree => {
  const raw = tree[relPath];
  if (raw === undefined) {
    throw new Error(`Missing file in tree: ${relPath}`);
  }
  const pkg = parsePackageJson(raw);
  fn(pkg);
  return { ...tree, [relPath]: stringifyPackageJson(pkg) };
};

const nextAppRuntimeDeps: { dependencies: readonly ManagedDependency[] } = {
  dependencies: ["next", "react", "react-dom"],
};

/** Shared by single-app root and `apps/web` in the Turborepo layout. */
const nextWebAppDevDependencies: readonly ManagedDependency[] = [
  "@tailwindcss/postcss",
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "@typescript/native-preview",
  "tailwindcss",
  "typescript",
];

const monorepoRootSharedDevDeps: readonly ManagedDependency[] = ["turbo", "typescript"];

const webAppDeps: {
  dependencies: readonly ManagedDependency[];
  devDependencies: readonly ManagedDependency[];
} = {
  dependencies: ["next", "react", "react-dom"],
  devDependencies: nextWebAppDevDependencies,
};

const designSystemDeps: {
  dependencies: readonly ManagedDependency[];
  devDependencies: readonly ManagedDependency[];
  peerDependencies: readonly ManagedDependency[];
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
  base: readonly ManagedDependency[],
) => {
  const out: ManagedDependency[] = [...base];
  if (hasAddon(config, "ultracite")) {
    out.push("ultracite");
  }
  return out;
};

const applyMonorepoCatalog = (tree: FileTree, config: ProjectConfig): FileTree => {
  const tsConfigName = scoped(config.npmScope, "typescript-config");
  const dsName = scoped(config.npmScope, "design-system");

  let t = withPackageJson(tree, "package.json", (pkg) => {
    mergeDependenciesFromCatalog(pkg, {
      devDependencies: devDepsWithOptionalUltracite(config, monorepoRootSharedDevDeps),
    });
  });

  t = withPackageJson(t, "apps/web/package.json", (pkg) => {
    mergeDependenciesFromCatalog(pkg, {
      dependencies: webAppDeps.dependencies,
      devDependencies: devDepsWithOptionalUltracite(config, webAppDeps.devDependencies),
    });
    if (hasPackage(config, "typescript-config")) {
      const devDeps = pkg.devDependencies as Record<string, string>;
      devDeps[tsConfigName] = "workspace:*";
    }
    if (hasDesignSystem(config)) {
      const deps = pkg.dependencies as Record<string, string>;
      deps[dsName] = "workspace:*";
    }
  });

  if (hasDesignSystem(config)) {
    t = withPackageJson(t, "packages/design-system/package.json", (pkg) => {
      mergeDependenciesFromCatalog(pkg, {
        dependencies: designSystemDeps.dependencies,
        devDependencies: designSystemDeps.devDependencies,
        peerDependencies: designSystemDeps.peerDependencies,
      });
      const devDeps = pkg.devDependencies as Record<string, string>;
      devDeps[tsConfigName] = "workspace:*";
    });
  }

  return t;
};

export const applyDependencyCatalog = (tree: FileTree, config: ProjectConfig): FileTree => {
  if (!isMonorepo(config)) {
    return withPackageJson(tree, "package.json", (pkg) => {
      mergeDependenciesFromCatalog(pkg, {
        dependencies: nextAppRuntimeDeps.dependencies,
        devDependencies: devDepsWithOptionalUltracite(config, nextWebAppDevDependencies),
      });
    });
  }
  return applyMonorepoCatalog(tree, config);
};
