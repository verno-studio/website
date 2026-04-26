import type { ProjectConfig } from "../config";
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

const nextAppDeps: {
  dependencies: readonly ManagedDependency[];
  devDependencies: readonly ManagedDependency[];
} = {
  dependencies: ["next", "react", "react-dom"],
  devDependencies: [
    "@tailwindcss/postcss",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "tailwindcss",
    "typescript",
    "ultracite",
  ],
};

const monorepoRootDevDeps: readonly ManagedDependency[] = [
  "oxfmt",
  "oxlint",
  "turbo",
  "typescript",
  "ultracite",
];

const webAppDeps: {
  dependencies: readonly ManagedDependency[];
  devDependencies: readonly ManagedDependency[];
} = {
  dependencies: ["next", "react", "react-dom"],
  devDependencies: [
    "@tailwindcss/postcss",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "tailwindcss",
    "typescript",
  ],
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
  devDependencies: ["@types/react", "@types/react-dom", "shadcn", "typescript"],
  peerDependencies: ["react", "react-dom"],
};

const applyMonorepoCatalog = (
  tree: FileTree,
  options: { readonly tsConfigName: string },
): FileTree => {
  let t = withPackageJson(tree, "package.json", (pkg) => {
    mergeDependenciesFromCatalog(pkg, { devDependencies: monorepoRootDevDeps });
  });

  t = withPackageJson(t, "apps/web/package.json", (pkg) => {
    mergeDependenciesFromCatalog(pkg, {
      dependencies: webAppDeps.dependencies,
      devDependencies: webAppDeps.devDependencies,
    });
    const devDeps = pkg.devDependencies as Record<string, string>;
    devDeps[options.tsConfigName] = "workspace:*";
  });

  t = withPackageJson(t, "packages/design-system/package.json", (pkg) => {
    mergeDependenciesFromCatalog(pkg, {
      dependencies: designSystemDeps.dependencies,
      devDependencies: designSystemDeps.devDependencies,
      peerDependencies: designSystemDeps.peerDependencies,
    });
    const devDeps = pkg.devDependencies as Record<string, string>;
    devDeps[options.tsConfigName] = "workspace:*";
  });

  return t;
};

export const applyDependencyCatalog = (tree: FileTree, config: ProjectConfig): FileTree => {
  if (config.template === "next-app") {
    return withPackageJson(tree, "package.json", (pkg) => {
      mergeDependenciesFromCatalog(pkg, {
        dependencies: nextAppDeps.dependencies,
        devDependencies: nextAppDeps.devDependencies,
      });
    });
  }

  const tsConfigName = scoped(config.npmScope, "typescript-config");
  return applyMonorepoCatalog(tree, { tsConfigName });
};
