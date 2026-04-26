import { describe, expect, test } from "bun:test";
import { UnhandledException } from "better-result";
import { errorToCreateJson } from "./json-output";

describe("errorToCreateJson", () => {
  test("unwraps UnhandledException to underlying cause", () => {
    const err = new UnhandledException({ cause: new Error("inner") });
    const j = errorToCreateJson(err);
    expect(j.ok).toBe(false);
    if (!j.ok) {
      expect(j.error.message).toContain("inner");
    }
  });
});
