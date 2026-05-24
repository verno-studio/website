import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  checkCliVersion,
  checkUltraciteDep,
  checkOxlintConfig,
  checkOxfmtConfig,
  checkGlobalsCssBaseLayer,
  runUpdateChecks,
  EXPECTED_ULTRACITE_VERSION,
} from "../src/commands/update/detect";
import { readCliPackageVersion } from "../src/cli-version";

const TEST_DIR = join(tmpdir(), `verno-update-detect-test-${Math.random().toString(36).slice(2)}`);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { force: true, recursive: true });
});

describe("Update Detect Actions", () => {
  test("checkCliVersion detects mismatch vs current version", () => {
    const check = checkCliVersion("0.1.0");
    expect(check.needsUpdate).toBe(true);
    expect(check.current).toBe("0.1.0");
    expect(check.expected).toBe(readCliPackageVersion());
  });

  test("checkCliVersion reports up to date when matches current version", () => {
    const cliVersion = readCliPackageVersion();
    const check = checkCliVersion(cliVersion);
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe(cliVersion);
    expect(check.expected).toBe(cliVersion);
  });

  test("checkUltraciteDep detects missing or outdated dependency", () => {
    // Missing package.json
    let check = checkUltraciteDep(TEST_DIR);
    // missing implies not expected/installed in package.json
    expect(check.needsUpdate).toBe(false);

    // package.json with outdated ultracite
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({
        devDependencies: {
          ultracite: "7.5.0",
        },
      }),
    );
    check = checkUltraciteDep(TEST_DIR);
    expect(check.needsUpdate).toBe(true);
    expect(check.current).toBe("7.5.0");
    expect(check.expected).toBe(EXPECTED_ULTRACITE_VERSION);

    // package.json with current ultracite
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({
        devDependencies: {
          ultracite: EXPECTED_ULTRACITE_VERSION,
        },
      }),
    );
    check = checkUltraciteDep(TEST_DIR);
    expect(check.needsUpdate).toBe(false);
  });

  test("checkOxlintConfig detects missing or non-canonical configs", () => {
    // Missing config
    let check = checkOxlintConfig(TEST_DIR);
    expect(check.needsUpdate).toBe(true);
    expect(check.current).toBe("missing");

    // Canonical config
    writeFileSync(
      join(TEST_DIR, "oxlint.config.ts"),
      'import ultracite from "ultracite/presets/oxlint";\nexport default ultracite();',
    );
    check = checkOxlintConfig(TEST_DIR);
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe("canonical");
    expect(check.skipReason).toBeUndefined();

    // Customized config
    writeFileSync(join(TEST_DIR, "oxlint.config.ts"), "// custom config");
    check = checkOxlintConfig(TEST_DIR);
    // skip/do not update
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe("customized");
    expect(check.skipReason).toBeDefined();
  });

  test("checkOxfmtConfig detects missing or non-canonical configs", () => {
    // Missing config
    let check = checkOxfmtConfig(TEST_DIR);
    expect(check.needsUpdate).toBe(true);
    expect(check.current).toBe("missing");

    // Canonical config
    writeFileSync(
      join(TEST_DIR, "oxfmt.config.ts"),
      'import ultracite from "ultracite/presets/oxfmt";\nexport default ultracite();',
    );
    check = checkOxfmtConfig(TEST_DIR);
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe("canonical");
    expect(check.skipReason).toBeUndefined();

    // Customized config
    writeFileSync(join(TEST_DIR, "oxfmt.config.ts"), "// custom config");
    check = checkOxfmtConfig(TEST_DIR);
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe("customized");
    expect(check.skipReason).toBeDefined();
  });

  test("checkGlobalsCssBaseLayer detects presence or absence of base layer", () => {
    const cssDir = join(TEST_DIR, "app");
    mkdirSync(cssDir, { recursive: true });
    const cssPath = join(cssDir, "globals.css");

    // Missing file
    let check = checkGlobalsCssBaseLayer(TEST_DIR, false);
    // missing globals.css doesn't trigger base layer update by default
    expect(check.needsUpdate).toBe(false);

    // File without marker
    writeFileSync(cssPath, "body { color: red; }");
    check = checkGlobalsCssBaseLayer(TEST_DIR, false);
    expect(check.needsUpdate).toBe(true);
    expect(check.current).toBe("missing base layer");

    // File with marker
    writeFileSync(cssPath, "/* This layer is by Verno Studio */\n@layer base {}");
    check = checkGlobalsCssBaseLayer(TEST_DIR, false);
    expect(check.needsUpdate).toBe(false);
    expect(check.current).toBe("present");
  });

  test("runUpdateChecks runs checks and returns correct status", async () => {
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({
        devDependencies: {
          ultracite: "7.5.0",
        },
      }),
    );
    mkdirSync(join(TEST_DIR, ".verno"), { recursive: true });
    writeFileSync(
      join(TEST_DIR, ".verno", "manifest.json"),
      JSON.stringify({
        addons: ["ultracite"],
        createdAt: new Date().toISOString(),
        frontend: "next",
        generator: "verno",
        generatorVersion: "0.1.0",
        packageManager: "bun",
        packages: [],
        projectName: "my-app",
        studio: "Verno Studio",
        ui: "none",
        ultraciteLinter: "oxlint",
      }),
    );

    const checks = await runUpdateChecks(TEST_DIR);
    const versionCheck = checks.find((c) => c.id === "manifest-version");
    const depCheck = checks.find((c) => c.id === "ultracite-dep");
    const oxlintCheck = checks.find((c) => c.id === "oxlint-config");

    expect(versionCheck).toBeDefined();
    expect(versionCheck?.needsUpdate).toBe(true);

    expect(depCheck).toBeDefined();
    expect(depCheck?.needsUpdate).toBe(true);

    expect(oxlintCheck).toBeDefined();
    expect(oxlintCheck?.needsUpdate).toBe(true);
  });
});
