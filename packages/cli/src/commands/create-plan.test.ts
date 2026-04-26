import { describe, expect, test } from "bun:test";
import { buildCreatePlan, getPlanSummary } from "./create-plan";
import { getProjectPath } from "./create-actions";
import { resolveCreateInputsNonInteractive } from "./create-args";

describe("buildCreatePlan", () => {
  test("builds step list for next-app with all hooks", () => {
    const r = resolveCreateInputsNonInteractive(["demo", "-y"], {
      "dry-run": false,
      help: false,
      json: false,
      "no-git": false,
      "no-install": false,
      "package-manager": undefined,
      "shadcn-preset": undefined,
      "skip-shadcn": false,
      "skip-ultracite": false,
      template: "next-app",
      ui: undefined,
      yes: true,
    });
    const projectDir = getProjectPath(r.name);
    const { steps } = buildCreatePlan(r, projectDir);
    expect(steps.find((s) => s.id === "scaffold")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "install")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "shadcn")?.command?.file).toBe("bun");
  });

  test("getPlanSummary is JSON-serializable", () => {
    const r = resolveCreateInputsNonInteractive(
      ["a", "-y", "--no-install", "--no-git", "--skip-shadcn", "--skip-ultracite"],
      {
        "dry-run": true,
        help: false,
        json: true,
        "no-git": true,
        "no-install": true,
        "package-manager": "pnpm",
        "shadcn-preset": undefined,
        "skip-shadcn": true,
        "skip-ultracite": true,
        template: "next-app",
        ui: "none",
        yes: true,
      },
    );
    const { steps } = buildCreatePlan(r, getProjectPath("a"));
    const summary = getPlanSummary(r, getProjectPath("a"), steps);
    const json = structuredClone(summary) as unknown;
    expect((json as { projectName: string }).projectName).toBe("a");
  });
});
