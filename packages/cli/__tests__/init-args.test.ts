import { describe, expect, test } from "bun:test";
import { resolveInitInputsNonInteractive, toInitCommandOptions } from "../src/commands/init-args";

describe("toInitCommandOptions", () => {
  test("normalizes commander-style flags", () => {
    const o = toInitCommandOptions({
      addons: "turborepo,ultracite",
      dryRun: true,
      packageManager: "npm",
      skipShadcn: true,
      skipUltracite: true,
      yes: true,
    });
    expect(o.dryRun).toBe(true);
    expect(o.yes).toBe(true);
    expect(o.skipShadcn).toBe(true);
    expect(o.skipUltracite).toBe(true);
    expect(o.addons).toBe("turborepo,ultracite");
    expect(o.packageManager).toBe("npm");
  });

  test("defaults missing booleans to false", () => {
    const o = toInitCommandOptions({});
    expect(o.dryRun).toBe(false);
    expect(o.yes).toBe(false);
    expect(o.noInstall).toBe(false);
    expect(o.skipShadcn).toBe(false);
    expect(o.skipUltracite).toBe(false);
  });
});

describe("resolveInitInputsNonInteractive", () => {
  test("defaults package manager to bun when not specified", () => {
    const r = resolveInitInputsNonInteractive({
      dryRun: false,
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    expect(r.packageManager).toBe("bun");
  });

  test("applies --skip-shadcn and filters ultracite via --skip-ultracite", () => {
    const r = resolveInitInputsNonInteractive({
      addons: "ultracite",
      dryRun: false,
      noInstall: false,
      skipShadcn: true,
      skipUltracite: true,
      yes: true,
    });
    expect(r.useShadcn).toBe(false);
    expect(r.runUltracite).toBe(false);
    expect(r.nonInteractive).toBe(true);
    expect(r.addons.includes("ultracite")).toBe(false);
  });

  test("parses addons and enables ultracite when selected", () => {
    const r = resolveInitInputsNonInteractive({
      addons: "ultracite",
      dryRun: false,
      noInstall: false,
      packageManager: "npm",
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    expect(r.packageManager).toBe("npm");
    expect(r.addons).toContain("ultracite");
    expect(r.runUltracite).toBe(true);
    expect(r.ultraciteLinter).toBe("oxlint");
    expect(r.nonInteractive).toBe(true);
  });

  test("accepts --linter oxlint with ultracite", () => {
    const r = resolveInitInputsNonInteractive({
      addons: "ultracite",
      dryRun: false,
      linter: "oxlint",
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    expect(r.ultraciteLinter).toBe("oxlint");
  });

  test("rejects --linter without ultracite add-on", () => {
    expect(() =>
      resolveInitInputsNonInteractive({
        addons: "turborepo",
        dryRun: false,
        linter: "biome",
        noInstall: false,
        skipShadcn: false,
        skipUltracite: false,
        yes: true,
      }),
    ).toThrow("--linter requires ultracite");
  });

  test("enables shadcn by default with turborepo addon", () => {
    const r = resolveInitInputsNonInteractive({
      addons: "turborepo",
      dryRun: false,
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    expect(r.addons).toContain("turborepo");
    expect(r.useShadcn).toBe(true);
  });

  test("sets useShadcn when ui is shadcn and not skipped", () => {
    const r = resolveInitInputsNonInteractive({
      addons: "turborepo",
      dryRun: false,
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    expect(r.useShadcn).toBe(true);
    expect(r.ui).toBe("shadcn");
  });

  test("ui none when skipShadcn is true", () => {
    const r = resolveInitInputsNonInteractive({
      dryRun: false,
      noInstall: false,
      skipShadcn: true,
      skipUltracite: false,
      ui: "none",
      yes: true,
    });
    expect(r.useShadcn).toBe(false);
    expect(r.ui).toBe("none");
  });
});
