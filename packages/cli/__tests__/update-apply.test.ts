import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  updateUltraciteDep,
  regenerateOxlintConfig,
  regenerateOxfmtConfig,
  updateGlobalsCssBaseLayer,
  updateManifestVersion,
  applyUpdates,
} from "../src/commands/update/apply";
import { EXPECTED_ULTRACITE_VERSION } from "../src/commands/update/detect";
import { readCliPackageVersion } from "../src/cli-version";

const TEST_DIR = join(tmpdir(), `verno-update-apply-test-${Math.random().toString(36).slice(2)}`);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { force: true, recursive: true });
});

describe("Update Apply Actions", () => {
  test("updateUltraciteDep bumps version in package.json devDependencies", () => {
    const pkgPath = join(TEST_DIR, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        devDependencies: {
          ultracite: "7.5.0",
        },
      }),
    );

    const res = updateUltraciteDep(TEST_DIR);
    expect(res.success).toBe(true);

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      devDependencies?: Record<string, string>;
    };
    expect(pkg.devDependencies?.ultracite).toBe(EXPECTED_ULTRACITE_VERSION);
  });

  test("updateUltraciteDep bumps version in package.json dependencies", () => {
    const pkgPath = join(TEST_DIR, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        dependencies: {
          ultracite: "7.5.0",
        },
      }),
    );

    const res = updateUltraciteDep(TEST_DIR);
    expect(res.success).toBe(true);

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.ultracite).toBe(EXPECTED_ULTRACITE_VERSION);
  });

  test("regenerateOxlintConfig generates oxlint config file", () => {
    const res = regenerateOxlintConfig(TEST_DIR);
    expect(res.success).toBe(true);

    const path = join(TEST_DIR, "oxlint.config.ts");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    expect(content).toContain("ultracite/presets/oxlint");
  });

  test("regenerateOxfmtConfig generates oxfmt config file", () => {
    const res = regenerateOxfmtConfig(TEST_DIR);
    expect(res.success).toBe(true);

    const path = join(TEST_DIR, "oxfmt.config.ts");
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, "utf-8");
    expect(content).toContain("ultracite/presets/oxfmt");
  });

  test("updateGlobalsCssBaseLayer injects verno base layer", async () => {
    const cssDir = join(TEST_DIR, "app");
    mkdirSync(cssDir, { recursive: true });
    const cssPath = join(cssDir, "globals.css");
    writeFileSync(cssPath, "body { color: blue; }\n");

    const res = await updateGlobalsCssBaseLayer(TEST_DIR, false);
    expect(res.success).toBe(true);

    const content = readFileSync(cssPath, "utf-8");
    expect(content).toContain("/* This layer is by Verno Studio */");
    expect(content).toContain("@layer base");
  });

  test("updateManifestVersion updates manifest version to match current CLI version", async () => {
    const manifestDir = join(TEST_DIR, ".verno");
    mkdirSync(manifestDir, { recursive: true });
    const manifestPath = join(manifestDir, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify({
        addons: [],
        createdAt: "2026-05-24T12:00:00Z",
        frontend: "next",
        generator: "verno",
        generatorVersion: "0.1.0",
        packageManager: "bun",
        packages: [],
        projectName: "my-app",
        studio: "Verno Studio",
        ui: "none",
      }),
    );

    const res = await updateManifestVersion(TEST_DIR);
    expect(res.success).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as {
      generatorVersion: string;
    };
    expect(manifest.generatorVersion).toBe(readCliPackageVersion());
  });

  test("applyUpdates executes correct update functions based on needsUpdate", async () => {
    const pkgPath = join(TEST_DIR, "package.json");
    writeFileSync(
      pkgPath,
      JSON.stringify({
        devDependencies: {
          ultracite: "7.5.0",
        },
      }),
    );

    const manifestDir = join(TEST_DIR, ".verno");
    mkdirSync(manifestDir, { recursive: true });
    writeFileSync(
      join(manifestDir, "manifest.json"),
      JSON.stringify({
        addons: [],
        createdAt: "2026-05-24T12:00:00Z",
        frontend: "next",
        generator: "verno",
        generatorVersion: "0.1.0",
        packageManager: "bun",
        packages: [],
        projectName: "my-app",
        studio: "Verno Studio",
        ui: "none",
      }),
    );

    const checks = [
      {
        category: "version" as const,
        current: "0.1.0",
        description: "Manifest generator version",
        expected: readCliPackageVersion(),
        id: "manifest-version",
        needsUpdate: true,
      },
      {
        category: "deps" as const,
        current: "7.5.0",
        description: "ultracite dependency in package.json",
        expected: EXPECTED_ULTRACITE_VERSION,
        id: "ultracite-dep",
        needsUpdate: true,
      },
      {
        category: "config" as const,
        current: "missing",
        description: "oxlint.config.ts",
        expected: "canonical",
        id: "oxlint-config",
        // oxlint update is NOT needed (e.g. maybe not using oxlint)
        needsUpdate: false,
      },
    ];

    const results = await applyUpdates(TEST_DIR, checks);
    expect(results.length).toBe(2);

    const manifestRes = results.find((r) => r.id === "manifest-version");
    const depRes = results.find((r) => r.id === "ultracite-dep");
    const oxlintRes = results.find((r) => r.id === "oxlint-config");

    expect(manifestRes?.success).toBe(true);
    expect(depRes?.success).toBe(true);
    expect(oxlintRes).toBeUndefined();

    // Verify side effects
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
      devDependencies?: Record<string, string>;
    };
    expect(pkg.devDependencies?.ultracite).toBe(EXPECTED_ULTRACITE_VERSION);

    const manifest = JSON.parse(readFileSync(join(manifestDir, "manifest.json"), "utf-8")) as {
      generatorVersion: string;
    };
    expect(manifest.generatorVersion).toBe(readCliPackageVersion());

    expect(existsSync(join(TEST_DIR, "oxlint.config.ts"))).toBe(false);
  });
});
