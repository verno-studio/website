import { describe, expect, test } from "bun:test";
import { buildInterpolatedFileTree } from "../generator";
import { applyDependencyCatalog } from "./apply-catalog";
import { scoped } from "../paths";
import { DEPENDENCY_VERSIONS } from "../catalog/dependencies";
import { TOOLING } from "../catalog/tooling";

describe("applyDependencyCatalog", () => {
  test("applies the same app dependency versions to next-app", () => {
    const tree = applyDependencyCatalog(
      buildInterpolatedFileTree({
        npmScope: "a",
        packageManager: "bun",
        projectDir: "/tmp",
        projectName: "a",
        template: "next-app",
      }),
      {
        npmScope: "a",
        packageManager: "bun",
        projectDir: "/tmp",
        projectName: "a",
        template: "next-app",
      },
    );
    const pkg = JSON.parse(tree["package.json"] ?? "{}") as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
      packageManager: string;
    };
    expect(pkg.packageManager).toBe(`bun@${TOOLING.packageManagerVersions.bun}`);
    expect(pkg.dependencies.next).toBe(DEPENDENCY_VERSIONS.next);
    expect(pkg.devDependencies.ultracite).toBe(DEPENDENCY_VERSIONS.ultracite);
  });

  test("wires monorepo workspace and catalog versions", () => {
    const config = {
      npmScope: "acme",
      packageManager: "pnpm" as const,
      projectDir: "/tmp",
      projectName: "mono",
      shadcnPreset: "a2r6bw",
      template: "next-turborepo" as const,
    };
    const tree = applyDependencyCatalog(buildInterpolatedFileTree(config), config);
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
    expect(root.devDependencies.turbo).toBe(DEPENDENCY_VERSIONS.turbo);
    expect(web.dependencies[ds]).toBe("workspace:*");
    expect(web.dependencies.next).toBe(DEPENDENCY_VERSIONS.next);
    expect(web.devDependencies[tsc]).toBe("workspace:*");
    expect(design.devDependencies.shadcn).toBe(DEPENDENCY_VERSIONS.shadcn);
    expect(design.devDependencies[tsc]).toBe("workspace:*");
    expect(design.peerDependencies.react).toBe(DEPENDENCY_VERSIONS.react);
  });
});
