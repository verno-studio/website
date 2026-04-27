import { describe, expect, test } from "bun:test";
import {
  resolveCreateInputsNonInteractive,
  toCreateCommandOptions,
} from "../src/commands/create-args";

describe("toCreateCommandOptions", () => {
  test("normalizes commander-style flags", () => {
    const o = toCreateCommandOptions({
      dryRun: true,
      packageManager: "npm",
      skipShadcn: true,
      skipUltracite: true,
      template: "next-turborepo",
      yes: true,
    });
    expect(o.dryRun).toBe(true);
    expect(o.yes).toBe(true);
    expect(o.skipShadcn).toBe(true);
    expect(o.skipUltracite).toBe(true);
    expect(o.template).toBe("next-turborepo");
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
  test("applies --skip-shadcn and --skip-ultracite", () => {
    const r = resolveCreateInputsNonInteractive("x", {
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
  });

  test("parses short-style options via toCreateCommandOptions", () => {
    const r = resolveCreateInputsNonInteractive(
      "app",
      toCreateCommandOptions({
        packageManager: "npm",
        template: "next-app",
        yes: true,
      }),
    );
    expect(r.packageManager).toBe("npm");
    expect(r.template).toBe("next-app");
    expect(r.nonInteractive).toBe(true);
  });
});
