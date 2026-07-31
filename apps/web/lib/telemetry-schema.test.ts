import { describe, expect, test } from "bun:test";

import { telemetryBodySchema } from "@/lib/telemetry-schema";

describe("telemetryBodySchema", () => {
  test("parses a valid create_project payload with typical CLI properties", () => {
    const result = telemetryBodySchema.safeParse({
      distinctId: "anon-123",
      event: "create_project",
      properties: {
        cli_version: "1.2.3",
        node_version: "v22.0.0",
        platform: "darwin",
        template: "next",
      },
    });

    expect(result.success).toBe(true);
  });

  test("parses a legacy payload with email and name and preserves them in the schema output", () => {
    const result = telemetryBodySchema.safeParse({
      distinctId: "user@example.com",
      email: "user@example.com",
      event: "init_project",
      name: "Example User",
      properties: {},
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
      expect(result.data.name).toBe("Example User");
    }
  });

  test("rejects an unknown event name", () => {
    const result = telemetryBodySchema.safeParse({
      distinctId: "anon-123",
      event: "pwned",
      properties: {},
    });

    expect(result.success).toBe(false);
  });

  test("rejects a payload with more than 40 properties", () => {
    const properties: Record<string, unknown> = {};
    for (let i = 0; i < 41; i += 1) {
      properties[`key${i}`] = "value";
    }

    const result = telemetryBodySchema.safeParse({
      distinctId: "anon-123",
      event: "doctor_run",
      properties,
    });

    expect(result.success).toBe(false);
  });

  test("rejects a property value longer than 4096 characters", () => {
    const result = telemetryBodySchema.safeParse({
      distinctId: "anon-123",
      event: "$exception",
      properties: {
        $exception_stack_trace_raw: "a".repeat(5000),
      },
    });

    expect(result.success).toBe(false);
  });

  test("rejects a missing distinctId", () => {
    const result = telemetryBodySchema.safeParse({
      event: "update_run",
      properties: {},
    });

    expect(result.success).toBe(false);
  });

  test("rejects an empty distinctId", () => {
    const result = telemetryBodySchema.safeParse({
      distinctId: "",
      event: "update_run",
      properties: {},
    });

    expect(result.success).toBe(false);
  });
});
