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

  test("passes arbitrary preset to apply for app root (uses npx when package manager is bun)", () => {
    const cmd = getShadcnBootstrapCommand("bun", { monorepo: false, preset });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "apply", "--preset", preset, "-y"]);
  });

  test("monorepo adds -c apps/web so the CLI runs from repo root and uses apply", () => {
    const cmd = getShadcnBootstrapCommand("npm", { monorepo: true, preset });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual([
      "--yes",
      spec,
      "apply",
      "--preset",
      preset,
      "-y",
      "-c",
      "apps/web",
    ]);
  });
});

describe("getShadcnAddAllCommand", () => {
  const spec = getShadcnExecSpec();

  test("invokes add --all at the project root when not a monorepo", () => {
    const cmd = getShadcnAddAllCommand("bun", { monorepo: false });
    expect(cmd.file).toBe("npx");
    expect(cmd.args).toEqual(["--yes", spec, "add", "--all", "-y"]);
  });

  test("monorepo passes the same -c path as apply", () => {
    const cmd = getShadcnAddAllCommand("pnpm", { monorepo: true });
    expect(cmd.args).toEqual(["dlx", spec, "add", "--all", "-y", "-c", "apps/web"]);
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

  test("quiet mode with frameworks passes --frameworks before --quiet", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("pnpm", "quiet", {
      frameworks: ["react", "next"],
      linter: "oxlint",
    });
    expect(cmd.args).toEqual([
      "dlx",
      spec,
      "init",
      "--pm",
      "pnpm",
      "--linter",
      "oxlint",
      "--frameworks",
      "react",
      "next",
      "--quiet",
    ]);
  });

  test("interactive mode: no --quiet; optional --linter and --frameworks", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive", { linter: "oxlint" });
    expect(cmd.args).toEqual(["x", spec, "init", "--pm", "bun", "--linter", "oxlint"]);
    expect(cmd.args).not.toContain("--quiet");
  });

  test("interactive mode with frameworks passes --frameworks", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive", {
      frameworks: ["react", "next"],
      linter: "oxlint",
    });
    expect(cmd.args).toEqual([
      "x",
      spec,
      "init",
      "--pm",
      "bun",
      "--linter",
      "oxlint",
      "--frameworks",
      "react",
      "next",
    ]);
    expect(cmd.args).not.toContain("--quiet");
  });

  test("interactive mode without linter omits --linter so Ultracite can prompt", () => {
    const spec = getUltraciteExecSpec();
    const cmd = getUltraciteInitCommand("bun", "interactive");
    expect(cmd.args).toEqual(["x", spec, "init", "--pm", "bun"]);
    expect(cmd.args).not.toContain("--linter");
  });
});
