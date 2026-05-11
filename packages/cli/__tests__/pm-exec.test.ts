import { describe, expect, test } from "bun:test";
import { getShadcnExecSpec, getUltraciteExecSpec } from "@vernostudio/template-generator";
import {
  getShadcnBootstrapCommand,
  getShadcnAddAllCommand,
  getUltraciteInitCommand,
} from "../src/pm-exec";

describe("getShadcnBootstrapCommand", () => {
  const spec = getShadcnExecSpec();
  const preset = "a2r6bw";

  test("passes arbitrary preset to init for app root (uses npx when package manager is bun)", () => {
    const cmd = getShadcnBootstrapCommand("bun", { monorepoWithDesignSystem: false, preset });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "init", "-t", "next", "-p", preset, "-y"]);
  });

  test("monorepo + design-system adds -c packages/design-system so the CLI runs from repo root and uses apply instead of init", () => {
    const cmd = getShadcnBootstrapCommand("npm", { monorepoWithDesignSystem: true, preset });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual([
      "--yes",
      spec,
      "apply",
      "--preset",
      preset,
      "-y",
      "-c",
      "packages/design-system",
    ]);
  });
});

describe("getShadcnAddAllCommand", () => {
  const spec = getShadcnExecSpec();

  test("invokes add --all at app root when not using a design-system cwd", () => {
    const cmd = getShadcnAddAllCommand("bun", { monorepoWithDesignSystem: false });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "add", "--all", "-y"]);
  });

  test("monorepo + design-system passes the same -c path as init", () => {
    const cmd = getShadcnAddAllCommand("pnpm", { monorepoWithDesignSystem: true });
    expect(cmd.args).toEqual(["dlx", spec, "add", "--all", "-y", "-c", "packages/design-system"]);
  });
});

describe("getUltraciteInitCommand", () => {
  test("quiet mode: dlx, init, --pm, package manager, --quiet", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("pnpm", "quiet");
    expect(cmd.args).toEqual(["dlx", spec, "init", "--pm", "pnpm", "--quiet"]);
  });

  test("quiet mode with linter passes --linter before --quiet", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("pnpm", "quiet", { linter: "biome" });
    expect(cmd.args).toEqual(["dlx", spec, "init", "--pm", "pnpm", "--linter", "biome", "--quiet"]);
  });

  test("interactive mode: no --quiet; optional --linter", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive", { linter: "oxlint" });
    expect(cmd.args).toEqual(["x", spec, "init", "--pm", "bun", "--linter", "oxlint"]);
    expect(cmd.args).not.toContain("--quiet");
  });

  test("interactive mode without linter omits --linter so Ultracite can prompt", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive");
    expect(cmd.args).toEqual(["x", spec, "init", "--pm", "bun"]);
    expect(cmd.args).not.toContain("--linter");
  });
});
