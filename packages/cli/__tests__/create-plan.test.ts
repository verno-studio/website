import { describe, expect, test } from "bun:test";
import { buildCreatePlan, getPlanSummary } from "../src/commands/create-plan";
import { getProjectPath } from "../src/commands/create-actions";
import { resolveCreateInputsNonInteractive } from "../src/commands/create-args";

describe("buildCreatePlan", () => {
  test("builds step list for next-app with all hooks", () => {
    const r = resolveCreateInputsNonInteractive("demo", {
      dryRun: false,
      noGit: false,
      noInstall: false,
      skipShadcn: false,
      skipUltracite: false,
      template: "next-app",
      yes: true,
    });
    const projectDir = getProjectPath(r.name);
    const { steps } = buildCreatePlan(r, projectDir);
    expect(steps.find((s) => s.id === "scaffold")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "install")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "shadcn")?.command?.file).toBe("npx");
  });

  test("getPlanSummary is JSON-serializable", () => {
    const r = resolveCreateInputsNonInteractive("a", {
      dryRun: true,
      noGit: true,
      noInstall: true,
      packageManager: "pnpm",
      skipShadcn: true,
      skipUltracite: true,
      template: "next-app",
      ui: "none",
      yes: true,
    });
    const { steps } = buildCreatePlan(r, getProjectPath("a"));
    const summary = getPlanSummary(r, getProjectPath("a"), steps);
    const json = structuredClone(summary) as unknown;
    expect((json as { projectName: string }).projectName).toBe("a");
  });
});
