import { describe, expect, test } from "bun:test";
import type { ResolvedCreateInputs } from "../src/commands/create-args";
import { buildCreatePlan, getPlanSummary } from "../src/commands/create-plan";
import { getProjectPath } from "../src/commands/create-actions";
import { resolveCreateInputsNonInteractive } from "../src/commands/create-args";

describe("buildCreatePlan", () => {
  test("builds step list for single app with all hooks", () => {
    const r = resolveCreateInputsNonInteractive("demo", {
      addons: "ultracite",
      dryRun: false,
      noGit: false,
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      yes: true,
    });
    const projectDir = getProjectPath(r.name);
    const { steps } = buildCreatePlan(r, projectDir);
    expect(steps.find((s) => s.id === "scaffold")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "install")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "shadcn")?.command?.file).toBe("npx");
    const ultra = steps.find((s) => s.id === "ultracite")?.command;
    expect(ultra?.args).toContain("--linter");
    expect(ultra?.args).toContain("oxlint");
  });

  test("interactive create omits --linter in plan so Ultracite prompts", () => {
    const r: ResolvedCreateInputs = {
      addons: ["ultracite"],
      doGit: true,
      doInstall: true,
      frontend: "next",
      name: "demo",
      nonInteractive: false,
      packageManager: "bun",
      packages: [],
      runUltracite: true,
      shadcnPreset: "nova",
      ui: "shadcn",
      useShadcn: true,
    };
    const projectDir = getProjectPath(r.name);
    const { steps } = buildCreatePlan(r, projectDir);
    const ultra = steps.find((s) => s.id === "ultracite")?.command;
    expect(ultra?.args).not.toContain("--linter");
  });

  test("getPlanSummary is JSON-serializable", () => {
    const r = resolveCreateInputsNonInteractive("a", {
      dryRun: true,
      noGit: true,
      noInstall: true,
      packageManager: "pnpm",
      skipShadcn: true,
      skipUltracite: true,
      ui: "none",
      yes: true,
    });
    const { steps } = buildCreatePlan(r, getProjectPath("a"));
    const summary = getPlanSummary(r, getProjectPath("a"), steps);
    const json = structuredClone(summary) as unknown;
    expect((json as { projectName: string }).projectName).toBe("a");
  });
});
