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
  codeQuality: "oxlint-oxfmt",
  frontend: "next",
  npmScope: "a",
  packageManager: "bun",
  packages: [],
  projectName: "a",
  ui: "none",
};

const fullMonorepo: ProjectConfig = {
  addons: ["turborepo", "ultracite"],
  codeQuality: "oxlint-oxfmt",
  frontend: "next",
  npmScope: "acme",
  packageManager: "pnpm",
  packages: ["typescript-config", "design-system"],
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
    const ds = scoped("acme", "design-system");
    const tsc = scoped("acme", "typescript-config");
    const root = JSON.parse(tree["package.json"] ?? "{}") as {
      devDependencies: Record<string, string>;
    };
    const web = JSON.parse(tree["apps/web/package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const design = JSON.parse(tree["packages/design-system/package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      peerDependencies: Record<string, string>;
    };
    expect(root.devDependencies.turbo).toBe(dependencyVersionMap.turbo);
    expect(root.devDependencies.oxlint).toBeUndefined();
    expect(root.devDependencies.oxfmt).toBeUndefined();
    expect(web.dependencies[ds]).toBe("workspace:*");
    expect(web.dependencies.next).toBe(dependencyVersionMap.next);
    expect(web.devDependencies[tsc]).toBe("workspace:*");
    expect(design.devDependencies.shadcn).toBe(dependencyVersionMap.shadcn);
    expect(design.devDependencies[tsc]).toBe("workspace:*");
    expect(design.peerDependencies.react).toBe(dependencyVersionMap.react);
  });
});
