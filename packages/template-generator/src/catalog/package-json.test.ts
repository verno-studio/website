import { describe, expect, test } from "bun:test";
import { DEPENDENCY_VERSIONS } from "./dependencies";
import {
  mergeDependenciesFromCatalog,
  parsePackageJson,
  stringifyPackageJson,
} from "./package-json";

describe("mergeDependenciesFromCatalog", () => {
  test("fills undefined keys from the catalog; preserves existing and workspace pins", () => {
    const pkg: Record<string, unknown> = {
      dependencies: {
        "@scope/pkg": "workspace:*",
        next: "1.0.0",
      },
    };
    mergeDependenciesFromCatalog(pkg, {
      dependencies: ["next", "react", "react-dom"],
    });
    const deps = pkg.dependencies as Record<string, string>;
    expect(deps["next"]).toBe("1.0.0");
    expect(deps["@scope/pkg"]).toBe("workspace:*");
    expect(deps["react"]).toBe(DEPENDENCY_VERSIONS.react);
    expect(deps["react-dom"]).toBe(DEPENDENCY_VERSIONS["react-dom"]);
  });

  test("normalizes and merges devDependencies and peerDependencies sections", () => {
    const pkg: Record<string, unknown> = {};
    mergeDependenciesFromCatalog(pkg, {
      devDependencies: ["ultracite"],
      peerDependencies: ["react", "react-dom"],
    });
    expect((pkg.devDependencies as Record<string, string>).ultracite).toBe(
      DEPENDENCY_VERSIONS.ultracite,
    );
    expect((pkg.peerDependencies as Record<string, string>).react).toBe(DEPENDENCY_VERSIONS.react);
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
