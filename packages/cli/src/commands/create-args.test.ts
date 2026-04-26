import { describe, expect, test } from "bun:test";
import { parseCreateArgv, resolveCreateInputsNonInteractive } from "./create-args";

describe("parseCreateArgv", () => {
  test("parses --dry-run and --json with -y", () => {
    const { values, positionals } = parseCreateArgv([
      "my-proj",
      "-y",
      "--dry-run",
      "--json",
      "-T",
      "next-turborepo",
    ]);
    expect(values["dry-run"]).toBe(true);
    expect(values.json).toBe(true);
    expect(values.yes).toBe(true);
    expect(positionals).toEqual(["my-proj"]);
  });

  test("short flags for template and package manager", () => {
    const { values } = parseCreateArgv(["app", "-y", "-T", "next-app", "-p", "npm"]);
    expect(values.template).toBe("next-app");
    expect(values["package-manager"]).toBe("npm");
  });
});

describe("resolveCreateInputsNonInteractive", () => {
  test("applies --skip-shadcn and --skip-ultracite", () => {
    const r = resolveCreateInputsNonInteractive(["x"], {
      "dry-run": false,
      help: false,
      json: false,
      "no-git": false,
      "no-install": false,
      "package-manager": undefined,
      "shadcn-preset": undefined,
      "skip-shadcn": true,
      "skip-ultracite": true,
      template: undefined,
      ui: undefined,
      yes: true,
    });
    expect(r.useShadcn).toBe(false);
    expect(r.runUltracite).toBe(false);
  });
});
