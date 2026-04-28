import { describe, expect, test } from "bun:test";
import { VirtualFileSystem } from "../core/virtual-fs";
import {
  addPackageDependency,
  dependencyVersionMap,
  getDependencyVersion,
  parsePackageJson,
  stringifyPackageJson,
} from "./add-deps";
import type { AvailableDependencies } from "./add-deps";

describe("getDependencyVersion", () => {
  test("returns a version for every managed dependency", () => {
    const keys = Object.keys(dependencyVersionMap) as AvailableDependencies[];
    for (const k of keys) {
      const v = getDependencyVersion(k);
      expect(v.length).toBeGreaterThan(0);
    }
  });

  test("next matches catalog value", () => {
    expect(getDependencyVersion("next")).toBe(dependencyVersionMap.next);
  });
});

describe("addPackageDependency", () => {
  test("fills undefined keys from the catalog; preserves existing and workspace pins", () => {
    const vfs = new VirtualFileSystem();
    vfs.writeFile(
      "package.json",
      stringifyPackageJson({
        dependencies: {
          "@scope/pkg": "workspace:*",
          next: "1.0.0",
        },
      }),
    );
    addPackageDependency({
      dependencies: ["next", "react", "react-dom"],
      packagePath: "package.json",
      vfs,
    });
    const pkg = parsePackageJson(vfs.readFile("package.json") ?? "{}");
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps["next"]).toBe("1.0.0");
    expect(deps["@scope/pkg"]).toBe("workspace:*");
    expect(deps["react"]).toBe(dependencyVersionMap.react);
    expect(deps["react-dom"]).toBe(dependencyVersionMap["react-dom"]);
  });

  test("normalizes and merges devDependencies and peerDependencies sections", () => {
    const vfs = new VirtualFileSystem();
    vfs.writeFile("package.json", stringifyPackageJson({}));
    addPackageDependency({
      devDependencies: ["ultracite"],
      packagePath: "package.json",
      peerDependencies: ["react", "react-dom"],
      vfs,
    });
    const pkg = parsePackageJson(vfs.readFile("package.json") ?? "{}");
    expect((pkg.devDependencies as Record<string, string>).ultracite).toBe(
      dependencyVersionMap.ultracite,
    );
    expect((pkg.peerDependencies as Record<string, string>).react).toBe(dependencyVersionMap.react);
  });
});

describe("parsePackageJson and stringifyPackageJson", () => {
  test("round-trips a minimal object and ends with trailing newline", () => {
    const raw = '{\n  "name": "x"\n}';
    const rec = parsePackageJson(raw);
    const out = stringifyPackageJson(rec);
    expect(out).toBe('{\n  "name": "x"\n}\n');
  });

  test("parsePackageJson rejects non-object JSON", () => {
    expect(() => parsePackageJson("[]")).toThrow("package.json must be a JSON object");
  });
});
