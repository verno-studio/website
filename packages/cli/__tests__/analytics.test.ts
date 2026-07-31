import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

const TEST_HOME = path.join(
  tmpdir(),
  `verno-analytics-test-${Math.random().toString(36).slice(2)}`,
);

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
  mkdirSync(TEST_HOME, { recursive: true });
  process.env["HOME"] = TEST_HOME;
});

afterEach(() => {
  process.env = originalEnv;
  rmSync(TEST_HOME, { force: true, recursive: true });
});

describe("isTelemetryEnabled", () => {
  test("DO_NOT_TRACK=1 disables telemetry", async () => {
    process.env["DO_NOT_TRACK"] = "1";
    delete process.env["VERNO_TELEMETRY_DISABLED"];
    const { isTelemetryEnabled } = await import("../src/analytics");
    expect(isTelemetryEnabled()).toBe(false);
  });

  test("VERNO_TELEMETRY_DISABLED=1 disables telemetry", async () => {
    delete process.env["DO_NOT_TRACK"];
    process.env["VERNO_TELEMETRY_DISABLED"] = "1";
    const { isTelemetryEnabled } = await import("../src/analytics");
    expect(isTelemetryEnabled()).toBe(false);
  });

  test("enabled when both are unset", async () => {
    delete process.env["DO_NOT_TRACK"];
    delete process.env["VERNO_TELEMETRY_DISABLED"];
    const { isTelemetryEnabled } = await import("../src/analytics");
    expect(isTelemetryEnabled()).toBe(true);
  });
});

describe("redactStack", () => {
  test("replaces the home directory prefix with ~", async () => {
    const { redactStack } = await import("../src/analytics");
    const home = homedir();
    const stack = `Error: boom\n    at foo (${home}/projects/x.ts:1:1)`;
    const redacted = redactStack(stack);
    expect(redacted).toContain("~/projects/x.ts");
    expect(redacted).not.toContain(home);
  });

  test("returns undefined for undefined input", async () => {
    const { redactStack } = await import("../src/analytics");
    const empty: { stack?: string } = {};
    expect(redactStack(empty.stack)).toBeUndefined();
  });

  test("caps output length at 4000 characters", async () => {
    const { redactStack } = await import("../src/analytics");
    const longStack = "a".repeat(10_000);
    const redacted = redactStack(longStack);
    expect(redacted?.length).toBeLessThanOrEqual(4000);
  });
});

describe("trackEvent payload shape", () => {
  test("sends an anonymous distinctId with no email or name keys", async () => {
    delete process.env["DO_NOT_TRACK"];
    delete process.env["VERNO_TELEMETRY_DISABLED"];

    const originalFetch = globalThis.fetch;
    let capturedBody: Record<string, unknown> | undefined;

    globalThis.fetch = ((_url: unknown, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body));
      return Promise.resolve(new Response(null, { status: 200 }));
    }) as typeof fetch;

    try {
      const { trackEvent } = await import("../src/analytics");
      await trackEvent("create_project", { a: 1 });
    } finally {
      globalThis.fetch = originalFetch;
    }

    expect(capturedBody).toBeDefined();
    const body = capturedBody as Record<string, unknown>;
    expect(typeof body["distinctId"]).toBe("string");
    expect((body["distinctId"] as string).length).toBeGreaterThan(0);
    expect(body).not.toHaveProperty("email");
    expect(body).not.toHaveProperty("name");
    const properties = body["properties"] as Record<string, unknown>;
    expect(properties["cli_version"]).toBeDefined();
  });
});
