import { describe, expect, test } from "bun:test";
import {
  resolveCreateInputsNonInteractive,
  toCreateCommandOptions,
} from "../src/commands/create-args";

describe("toCreateCommandOptions", () => {
  test("normalizes commander-style flags", () => {
    const o = toCreateCommandOptions({
      addons: "turborepo,ultracite",
      codeQuality: "biome",
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
    expect(o.codeQuality).toBe("biome");
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

  test("parses addons and default code quality for ultracite", () => {
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
    expect(r.codeQuality).toBe("oxlint-oxfmt");
    expect(r.nonInteractive).toBe(true);
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
