import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  updateUltraciteDep,
  regenerateUltraciteConfigs,
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

  test("regenerateUltraciteConfigs clears legacy configs, delegates to ultracite init once, and reports produced files", async () => {
    // A broken legacy config that must be replaced, alongside a missing oxfmt config.
    writeFileSync(
      join(TEST_DIR, "oxlint.config.ts"),
      'import ultracite from "ultracite/presets/oxlint";\nexport default ultracite();',
    );

    const calls: string[] = [];
    const results = await regenerateUltraciteConfigs(TEST_DIR, ["oxlint-config", "oxfmt-config"], {
      packageManager: "bun",
      runUltraciteInit: (projectDir) => {
        calls.push(projectDir);
        // The legacy file must already be cleared when init runs.
        expect(existsSync(join(projectDir, "oxlint.config.ts"))).toBe(false);
        writeFileSync(
          join(projectDir, "oxlint.config.ts"),
          'import core from "ultracite/oxlint/core";\n',
        );
        writeFileSync(
          join(projectDir, "oxfmt.config.ts"),
          'import ultracite from "ultracite/oxfmt";\n',
        );
        return Promise.resolve();
      },
    });

    expect(calls).toEqual([TEST_DIR]);
    expect(results.map((r) => r.id).toSorted()).toEqual(["oxfmt-config", "oxlint-config"]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(readFileSync(join(TEST_DIR, "oxlint.config.ts"), "utf-8")).not.toContain("presets");
  });

  test("regenerateUltraciteConfigs reports failure when init does not produce a config", async () => {
    const results = await regenerateUltraciteConfigs(TEST_DIR, ["oxlint-config"], {
      packageManager: "bun",
      runUltraciteInit: () => Promise.resolve(),
    });
    expect(results.length).toBe(1);
    expect(results[0]?.success).toBe(false);
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

  test("applyUpdates regenerates both configs with a single ultracite init run", async () => {
    const checks = [
      {
        category: "config" as const,
        current: "missing",
        description: "oxlint.config.ts",
        expected: "canonical",
        id: "oxlint-config",
        needsUpdate: true,
      },
      {
        category: "config" as const,
        current: "legacy preset import",
        description: "oxfmt.config.ts",
        expected: "canonical",
        id: "oxfmt-config",
        needsUpdate: true,
      },
    ];

    let runs = 0;
    const results = await applyUpdates(TEST_DIR, checks, {
      packageManager: "bun",
      runUltraciteInit: (projectDir) => {
        runs += 1;
        writeFileSync(
          join(projectDir, "oxlint.config.ts"),
          'import c from "ultracite/oxlint/core";\n',
        );
        writeFileSync(join(projectDir, "oxfmt.config.ts"), 'import u from "ultracite/oxfmt";\n');
        return Promise.resolve();
      },
    });

    expect(runs).toBe(1);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.success)).toBe(true);
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

    const results = await applyUpdates(TEST_DIR, checks, {
      packageManager: "bun",
      runUltraciteInit: () => Promise.resolve(),
    });
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
