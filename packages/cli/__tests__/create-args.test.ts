import { describe, expect, test } from "bun:test";
import {
  resolveCreateInputsNonInteractive,
  toCreateCommandOptions,
} from "../src/commands/create/args";

describe("toCreateCommandOptions", () => {
  test("normalizes commander-style flags", () => {
    const o = toCreateCommandOptions({
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
    const o = toCreateCommandOptions({});
    expect(o.dryRun).toBe(false);
    expect(o.yes).toBe(false);
    expect(o.noGit).toBe(false);
    expect(o.noInstall).toBe(false);
    expect(o.skipShadcn).toBe(false);
    expect(o.skipUltracite).toBe(false);
  });
});

describe("resolveCreateInputsNonInteractive", () => {
  test("applies --skip-shadcn and filters ultracite via --skip-ultracite", () => {
    const r = resolveCreateInputsNonInteractive("x", {
      addons: "ultracite",
      dryRun: false,
      noGit: false,
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
    const r = resolveCreateInputsNonInteractive(
      "app",
      toCreateCommandOptions({
        addons: "ultracite",
        packageManager: "npm",
        yes: true,
      }),
    );
    expect(r.packageManager).toBe("npm");
    expect(r.addons).toContain("ultracite");
    expect(r.runUltracite).toBe(true);
    expect(r.ultraciteLinter).toBe("oxlint");
    expect(r.ultraciteFrameworks).toEqual(["react", "next"]);
    expect(r.nonInteractive).toBe(true);
  });

  test("accepts --frameworks react,next with ultracite", () => {
    const r = resolveCreateInputsNonInteractive(
      "u",
      toCreateCommandOptions({ addons: "ultracite", frameworks: "react,next", yes: true }),
    );
    expect(r.ultraciteFrameworks).toEqual(["react", "next"]);
  });

  test("rejects --frameworks without ultracite add-on", () => {
    expect(() =>
      resolveCreateInputsNonInteractive(
        "n",
        toCreateCommandOptions({ addons: "turborepo", frameworks: "react", yes: true }),
      ),
    ).toThrow("--frameworks requires ultracite");
  });

  test("accepts --linter oxlint with ultracite", () => {
    const r = resolveCreateInputsNonInteractive(
      "u",
      toCreateCommandOptions({ addons: "ultracite", linter: "oxlint", yes: true }),
    );
    expect(r.ultraciteLinter).toBe("oxlint");
  });

  test("rejects --linter without ultracite add-on", () => {
    expect(() =>
      resolveCreateInputsNonInteractive(
        "n",
        toCreateCommandOptions({ addons: "turborepo", linter: "biome", yes: true }),
      ),
    ).toThrow("--linter requires ultracite");
  });

  test("turborepo defaults workspace packages when --packages omitted", () => {
    const r = resolveCreateInputsNonInteractive(
      "mono",
      toCreateCommandOptions({ addons: "turborepo", yes: true }),
    );
    expect(r.addons).toContain("turborepo");
    expect(r.packages).toEqual(["typescript-config", "design-system"]);
  });
});
