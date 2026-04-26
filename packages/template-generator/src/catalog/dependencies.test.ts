import { describe, expect, test } from "bun:test";
import { DEPENDENCY_VERSIONS, getDependencyVersion } from "./dependencies";
import type { ManagedDependency } from "./dependencies";

describe("getDependencyVersion", () => {
  test("returns a version for every managed dependency", () => {
    const keys = Object.keys(DEPENDENCY_VERSIONS) as ManagedDependency[];
    for (const k of keys) {
      const v = getDependencyVersion(k);
      expect(v.length).toBeGreaterThan(0);
    }
  });

  test("next matches catalog value", () => {
    expect(getDependencyVersion("next")).toBe(DEPENDENCY_VERSIONS.next);
  });
});
