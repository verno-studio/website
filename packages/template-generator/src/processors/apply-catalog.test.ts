import { describe, expect, test } from "bun:test";
import { virtualFileSystemFromFileTree } from "../core/virtual-fs";
import type { ProjectConfig } from "../config";
import { buildInterpolatedFileTree } from "../generator";
import { scoped } from "../paths";
import { dependencyVersionMap } from "../utils/add-deps";
import { TOOLING } from "../catalog/tooling";
import { applyDependencyCatalog } from "./apply-catalog";

const appWithUltracite: ProjectConfig = {
  addons: ["ultracite"],
  frontend: "next",
  npmScope: "a",
  packageManager: "bun",
  packages: [],
  projectName: "a",
  ui: "none",
};

const fullMonorepo: ProjectConfig = {
  addons: ["turborepo", "ultracite"],
  frontend: "next",
  npmScope: "acme",
  packageManager: "pnpm",
  packages: ["typescript-config"],
  projectName: "mono",
  shadcnPreset: "a2r6bw",
  ui: "none",
};

describe("applyDependencyCatalog", () => {
  test("applies the same app dependency versions to a single Next app with ultracite", () => {
    const vfs = virtualFileSystemFromFileTree(buildInterpolatedFileTree(appWithUltracite));
    applyDependencyCatalog(vfs, appWithUltracite);
    const tree = vfs.toFileTree();
    const pkg = JSON.parse(tree["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      packageManager: string;
    };
    expect(pkg.packageManager).toBe(`bun@${TOOLING.packageManagerVersions.bun}`);
    expect(pkg.dependencies.next).toBe(dependencyVersionMap.next);
    expect(pkg.devDependencies.ultracite).toBe(dependencyVersionMap.ultracite);
  });

  test("wires monorepo workspace and catalog versions", () => {
    const vfs = virtualFileSystemFromFileTree(buildInterpolatedFileTree(fullMonorepo));
    applyDependencyCatalog(vfs, fullMonorepo);
    const tree = vfs.toFileTree();
    const tsc = scoped("acme", "typescript-config");
    const root = JSON.parse(tree["package.json"] ?? "{}") as {
      devDependencies: Record<string, string>;
    };
    const web = JSON.parse(tree["apps/web/package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(root.devDependencies.turbo).toBe(dependencyVersionMap.turbo);
    expect(root.devDependencies.oxlint).toBeUndefined();
    expect(root.devDependencies.oxfmt).toBeUndefined();
    expect(web.dependencies.next).toBe(dependencyVersionMap.next);
    expect(web.devDependencies[tsc]).toBe("workspace:*");
    expect(tree["packages/design-system/package.json"]).toBeUndefined();
  });

  test("when ui is shadcn, the app gets the theme provider and cn dependencies", () => {
    const config: ProjectConfig = { ...fullMonorepo, ui: "shadcn" };
    const vfs = virtualFileSystemFromFileTree(buildInterpolatedFileTree(config));
    applyDependencyCatalog(vfs, config);
    const tree = vfs.toFileTree();
    const web = JSON.parse(tree["apps/web/package.json"] ?? "{}") as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(web.dependencies?.["next-themes"]).toBe(dependencyVersionMap["next-themes"]);
    expect(web.dependencies?.clsx).toBe(dependencyVersionMap.clsx);
    expect(web.dependencies?.["tailwind-merge"]).toBe(dependencyVersionMap["tailwind-merge"]);
  });

  test("single app ui shadcn adds clsx and tailwind-merge for lib/utils cn()", () => {
    const config: ProjectConfig = { ...appWithUltracite, ui: "shadcn" };
    const vfs = virtualFileSystemFromFileTree(buildInterpolatedFileTree(config));
    applyDependencyCatalog(vfs, config);
    const tree = vfs.toFileTree();
    const pkg = JSON.parse(tree["package.json"] ?? "{}") as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.clsx).toBe(dependencyVersionMap.clsx);
    expect(pkg.dependencies?.["tailwind-merge"]).toBe(dependencyVersionMap["tailwind-merge"]);
  });
});
