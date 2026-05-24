import { describe, expect, test } from "bun:test";
import { toUpdateCommandOptions, resolveUpdateInputs } from "../src/commands/update/args";

describe("Update Args Parser", () => {
  test("toUpdateCommandOptions normalizes flags", () => {
    const o = toUpdateCommandOptions({
      dryRun: true,
      install: false,
      packageManager: "pnpm",
      yes: true,
    });
    expect(o.dryRun).toBe(true);
    expect(o.install).toBe(false);
    expect(o.yes).toBe(true);
    expect(o.packageManager).toBe("pnpm");
  });

  test("toUpdateCommandOptions uses defaults when flags are missing", () => {
    const o = toUpdateCommandOptions({});
    expect(o.dryRun).toBe(false);
    expect(o.install).toBe(true);
    expect(o.yes).toBe(false);
    expect(o.packageManager).toBeUndefined();
  });

  test("resolveUpdateInputs resolves flags", () => {
    const r = resolveUpdateInputs({
      dryRun: true,
      install: false,
      packageManager: "bun",
      yes: true,
    });
    expect(r.dryRun).toBe(true);
    expect(r.install).toBe(false);
    expect(r.packageManager).toBe("bun");
    expect(r.yes).toBe(true);
  });

  test("resolveUpdateInputs throws error on invalid package manager", () => {
    expect(() => {
      resolveUpdateInputs({
        dryRun: false,
        packageManager: "yarn",
        yes: false,
      });
    }).toThrow("Invalid --package-manager");
  });
});
