import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import type { PackageJsonRecord } from "@vernostudio/template-generator";
import {
  detectPackageJson,
  detectVernoManifest,
  detectShadcn,
  detectUltracite,
  detectMonorepo,
  detectPackageManager,
  detectProjectState,
  safeParsePackageJson,
} from "../src/commands/init-actions";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const TMP_DIR = "/tmp/verno-init-test";

beforeEach(() => {
  mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TMP_DIR, { force: true, recursive: true });
});

describe("detectPackageJson", () => {
  test("returns parsed package.json when exists", () => {
    writeFileSync(join(TMP_DIR, "package.json"), '{"name": "test-app", "version": "1.0.0"}');
    const result = detectPackageJson(TMP_DIR);
    expect(result).not.toBeNull();
    const name = (result as PackageJsonRecord | null)?.name;
    expect(name).toBe("test-app");
  });

  test("returns null when package.json does not exist", () => {
    const result = detectPackageJson(TMP_DIR);
    expect(result).toBeNull();
  });
});

describe("detectVernoManifest", () => {
  test("returns parsed manifest when .verno/manifest.json exists with verno generator", () => {
    mkdirSync(join(TMP_DIR, ".verno"), { recursive: true });
    writeFileSync(
      join(TMP_DIR, ".verno", "manifest.json"),
      JSON.stringify({ addons: ["turborepo"], generator: "verno", projectName: "test" }),
    );
    const result = detectVernoManifest(TMP_DIR);
    expect(result).not.toBeNull();
    const addons = (result as PackageJsonRecord | null)?.addons;
    expect(addons).toContain("turborepo");
  });

  test("returns null when manifest does not exist", () => {
    const result = detectVernoManifest(TMP_DIR);
    expect(result).toBeNull();
  });

  test("returns null when manifest has non-verno generator", () => {
    mkdirSync(join(TMP_DIR, ".verno"), { recursive: true });
    writeFileSync(join(TMP_DIR, ".verno", "manifest.json"), JSON.stringify({ generator: "other" }));
    const result = detectVernoManifest(TMP_DIR);
    expect(result).toBeNull();
  });
});

describe("detectShadcn", () => {
  test("returns true when components.json exists (non-mono)", () => {
    writeFileSync(join(TMP_DIR, "components.json"), "{}");
    expect(detectShadcn(TMP_DIR, false)).toBe(true);
  });

  test("returns false when components.json does not exist", () => {
    expect(detectShadcn(TMP_DIR, false)).toBe(false);
  });

  test("checks packages/design-system in monorepo mode", () => {
    mkdirSync(join(TMP_DIR, "packages", "design-system"), { recursive: true });
    writeFileSync(join(TMP_DIR, "packages", "design-system", "components.json"), "{}");
    expect(detectShadcn(TMP_DIR, true)).toBe(true);
  });
});

describe("detectUltracite", () => {
  test("returns true when oxlint.config.ts imports ultracite presets", () => {
    writeFileSync(
      join(TMP_DIR, "oxlint.config.ts"),
      'import core from "ultracite/oxlint/core";\nexport default {};\n',
    );
    expect(detectUltracite(TMP_DIR)).toBe(true);
  });

  test("returns true when package.json runs ultracite in lint script", () => {
    writeFileSync(
      join(TMP_DIR, "package.json"),
      JSON.stringify({
        devDependencies: { ultracite: "7.7.0" },
        name: "test",
        scripts: { lint: "ultracite check" },
      }),
    );
    expect(detectUltracite(TMP_DIR)).toBe(true);
  });

  test("returns false when ultracite is not configured", () => {
    expect(detectUltracite(TMP_DIR)).toBe(false);
  });
});

describe("detectMonorepo", () => {
  test("returns true when turbo.json exists", () => {
    writeFileSync(join(TMP_DIR, "turbo.json"), "{}");
    expect(detectMonorepo(TMP_DIR)).toBe(true);
  });

  test("returns true when pnpm-workspace.yaml exists", () => {
    writeFileSync(join(TMP_DIR, "pnpm-workspace.yaml"), "packages: ['packages/*']");
    expect(detectMonorepo(TMP_DIR)).toBe(true);
  });

  test("returns false when neither exists", () => {
    expect(detectMonorepo(TMP_DIR)).toBe(false);
  });
});

describe("detectPackageManager", () => {
  test("detects bun from packageManager field", () => {
    writeFileSync(
      join(TMP_DIR, "package.json"),
      JSON.stringify({ name: "test", packageManager: "bun@1.3.12" }),
    );
    expect(detectPackageManager(TMP_DIR)).toBe("bun");
  });

  test("detects pnpm from packageManager field", () => {
    writeFileSync(
      join(TMP_DIR, "package.json"),
      JSON.stringify({ name: "test", packageManager: "pnpm@9.15.0" }),
    );
    expect(detectPackageManager(TMP_DIR)).toBe("pnpm");
  });

  test("detects npm from lock file fallback", () => {
    writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify({ name: "test" }));
    writeFileSync(join(TMP_DIR, "package-lock.json"), "{}");
    expect(detectPackageManager(TMP_DIR)).toBe("npm");
  });

  test("returns null when nothing detectable", () => {
    writeFileSync(join(TMP_DIR, "package.json"), JSON.stringify({ name: "test" }));
    expect(detectPackageManager(TMP_DIR)).toBeNull();
  });
});

describe("detectProjectState", () => {
  test("aggregates all detection results", () => {
    writeFileSync(
      join(TMP_DIR, "package.json"),
      JSON.stringify({ name: "@scope/my-app", packageManager: "bun@1.3.12" }),
    );
    writeFileSync(join(TMP_DIR, "turbo.json"), "{}");
    mkdirSync(join(TMP_DIR, "packages", "design-system"), { recursive: true });
    writeFileSync(join(TMP_DIR, "packages", "design-system", "components.json"), "{}");

    const state = detectProjectState(TMP_DIR);
    expect(state.projectName).toBe("my-app");
    expect(state.isMonorepo).toBe(true);
    expect(state.hasShadcn).toBe(true);
    expect(state.packageManager).toBe("bun");
  });
});

describe("safeParsePackageJson", () => {
  test("parses valid JSON", () => {
    const result = safeParsePackageJson('{"name":"test","version":"1.0.0"}');
    expect(result).not.toBeNull();
    const name = (result as PackageJsonRecord | null)?.name;
    expect(name).toBe("test");
  });

  test("returns null for invalid JSON", () => {
    const result = safeParsePackageJson("{invalid");
    expect(result).toBeNull();
  });
});
