import { describe, expect, test } from "bun:test";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@verno/template-generator";
import { getShadcnBootstrapCommand, getUltraciteInitCommand } from "../src/pm-exec";

describe("getShadcnBootstrapCommand", () => {
  const spec = getShadcnExecSpec();
  const preset = "a2r6bw";

  test("passes arbitrary preset to init for next-app (uses npx when package manager is bun)", () => {
    const cmd = getShadcnBootstrapCommand("bun", { preset, template: "next-app" });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "init", "-t", "next", "-p", preset, "-y"]);
  });

  test("next-turborepo adds -c packages/design-system so the CLI runs from repo root", () => {
    const cmd = getShadcnBootstrapCommand("npm", { preset, template: "next-turborepo" });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual([
      "--yes",
      spec,
      "init",
      "-t",
      "next",
      "-p",
      preset,
      "-y",
      "-c",
      "packages/design-system",
    ]);
  });
});

describe("getUltraciteInitCommand", () => {
  test("quiet mode: dlx, init, --pm, package manager, --quiet", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("pnpm", "quiet");
    expect(cmd.args).toEqual(["dlx", spec, "init", "--pm", "pnpm", "--quiet"]);
  });

  test("interactive mode: no --quiet so Ultracite can prompt", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive");
    expect(cmd.args).toEqual(["x", spec, "init", "--pm", "bun"]);
    expect(cmd.args).not.toContain("--quiet");
    expect(cmd.args).not.toContain("--linter");
  });
});
