import { describe, expect, test } from "bun:test";
import { buildInitPlan, getInitPlanSummary } from "../src/commands/init-plan";
import type { ResolvedInitInputs } from "../src/commands/init-args";

const makeResolved = (overrides?: Partial<ResolvedInitInputs>): ResolvedInitInputs => ({
  addons: ["ultracite"] as const,
  doInstall: true,
  nonInteractive: true,
  packageManager: "bun",
  runUltracite: true,
  shadcnPreset: "nova",
  ui: "shadcn",
  ultraciteLinter: "oxlint",
  useShadcn: true,
  ...overrides,
});

const detected = {
  hasShadcn: false,
  hasUltracite: false,
  isMonorepo: false,
  packageManager: "bun" as const,
};

describe("buildInitPlan", () => {
  test("builds steps for init with ultracite addon (not yet installed)", () => {
    const resolved = makeResolved();
    const { steps } = buildInitPlan(resolved, detected, "/tmp/demo");

    expect(steps.find((s) => s.id === "install")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "shadcn")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "shadcn-all")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "ultracite")?.willRun).toBe(true);
    expect(steps.find((s) => s.id === "write-manifest")?.willRun).toBe(true);
  });

  test("skips shadcn when already present", () => {
    const resolved = makeResolved({ useShadcn: true });
    const det = { ...detected, hasShadcn: true };
    const { steps } = buildInitPlan(resolved, det, "/tmp/demo");

    const shadcnStep = steps.find((s) => s.id === "shadcn");
    expect(shadcnStep).toBeDefined();
    expect(shadcnStep?.willRun).toBe(false);
    expect(shadcnStep?.skippedReason).toBe("shadcn is already configured");
  });

  test("skips ultracite when already present", () => {
    const resolved = makeResolved();
    const det = { ...detected, hasUltracite: true };
    const { steps } = buildInitPlan(resolved, det, "/tmp/demo");

    const ultraStep = steps.find((s) => s.id === "ultracite");
    expect(ultraStep).toBeDefined();
    expect(ultraStep?.willRun).toBe(false);
    expect(ultraStep?.skippedReason).toBe("ultracite is already configured");
  });

  test("includes restructure step when turborepo requested and not monorepo", () => {
    const resolved = makeResolved({
      addons: ["turborepo", "ultracite"] as const,
    });
    const { steps } = buildInitPlan(resolved, detected, "/tmp/demo");

    expect(steps.find((s) => s.id === "restructure")?.willRun).toBe(true);
  });

  test("does not include restructure step when already monorepo", () => {
    const resolved = makeResolved({
      addons: ["turborepo", "ultracite"] as const,
    });
    const det = { ...detected, isMonorepo: true };
    const { steps } = buildInitPlan(resolved, det, "/tmp/demo");

    expect(steps.find((s) => s.id === "restructure")).toBeUndefined();
  });

  test("skips install when doInstall is false", () => {
    const resolved = makeResolved({ doInstall: false });
    const { steps } = buildInitPlan(resolved, detected, "/tmp/demo");

    const installStep = steps.find((s) => s.id === "install");
    expect(installStep).toBeDefined();
    expect(installStep?.willRun).toBe(false);
    expect(installStep?.skippedReason).toBe("Skipped (--no-install or declined in wizard)");
  });

  test("skips shadcn when ui is none", () => {
    const resolved = makeResolved({ ui: "none" as const, useShadcn: false });
    const { steps } = buildInitPlan(resolved, detected, "/tmp/demo");

    const shadcnStep = steps.find((s) => s.id === "shadcn");
    expect(shadcnStep).toBeDefined();
    expect(shadcnStep?.willRun).toBe(false);
    expect(shadcnStep?.skippedReason).toBe("Skipped (--ui none or --skip-shadcn)");
  });

  test("getInitPlanSummary is JSON-serializable", () => {
    const resolved = makeResolved();
    const { steps } = buildInitPlan(resolved, detected, "/tmp/demo");
    const summary = getInitPlanSummary(resolved, detected, "/tmp/demo", steps);
    const json = structuredClone(summary) as unknown;
    expect((json as { packageManager: string }).packageManager).toBe("bun");
  });
});
