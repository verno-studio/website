import { describe, expect, test } from "bun:test";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@verno/template-generator";
import { getShadcnBootstrapCommand, getUltraciteInitCommand } from "../src/pm-exec";

describe("getShadcnBootstrapCommand", () => {
  const spec = getShadcnExecSpec();
  const preset = "a2r6bw";

  test("passes arbitrary preset to init for next-app", () => {
    const cmd = getShadcnBootstrapCommand("bun", { preset, template: "next-app" });
    expect(cmd.file).toBe("bun");
    expect(cmd.args).toEqual(["x", "--bun", spec, "init", "-t", "next", "-p", preset, "-y"]);
  });

  test("uses the same init flow for next-turborepo with preset passthrough", () => {
    const cmd = getShadcnBootstrapCommand("npm", { preset, template: "next-turborepo" });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "init", "-t", "next", "-p", preset, "-y"]);
  });
});

describe("getUltraciteInitCommand", () => {
  test("uses catalog ultracite exec spec", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("pnpm");
    expect(cmd.args[0]).toBe("dlx");
    expect(cmd.args[1]).toBe(spec);
    expect(cmd.args).toContain("init");
    expect(cmd.args).toContain("oxlint");
  });
});
