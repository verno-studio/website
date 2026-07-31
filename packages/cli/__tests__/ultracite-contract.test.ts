import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import semver from "semver";
import { EXPECTED_ULTRACITE_VERSION } from "../src/commands/update/detect";
import { ULTRACITE_FRAMEWORK_IDS } from "../src/ultracite-framework";

const nodeRequire = createRequire(import.meta.url);

// `ultracite/package.json` is not an exported subpath; locate the package root
// from a resolvable entry instead (config/oxfmt/index.mjs -> package root).
const ultraciteRoot = join(dirname(nodeRequire.resolve("ultracite/oxfmt")), "..", "..");

/** Presets in ultracite's oxlint config dir that are not scaffold framework choices. */
const NON_FRAMEWORK_PRESETS = ["core", "jest", "vitest"];

describe("ultracite contract (installed package)", () => {
  test("every framework id resolves to an oxlint preset subpath", () => {
    for (const id of ULTRACITE_FRAMEWORK_IDS) {
      expect(() => nodeRequire.resolve(`ultracite/oxlint/${id}`)).not.toThrow();
    }
  });

  test("the oxfmt preset subpath resolves", () => {
    expect(() => nodeRequire.resolve("ultracite/oxfmt")).not.toThrow();
  });

  test("no unmapped oxlint presets — a failure means ultracite added a framework; add it to ULTRACITE_FRAMEWORK_IDS (or NON_FRAMEWORK_PRESETS)", () => {
    const available = readdirSync(join(ultraciteRoot, "config", "oxlint"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const known = new Set<string>([...ULTRACITE_FRAMEWORK_IDS, ...NON_FRAMEWORK_PRESETS]);
    const unmapped = available.filter((entry) => !known.has(entry));
    expect(unmapped).toEqual([]);
  });

  test("the catalog range covers the installed ultracite version", () => {
    const pkg = JSON.parse(readFileSync(join(ultraciteRoot, "package.json"), "utf-8")) as {
      version: string;
    };
    expect(semver.satisfies(pkg.version, EXPECTED_ULTRACITE_VERSION)).toBe(true);
  });
});
