import { describe, expect, test } from "bun:test";
import {
  DEFAULT_ULTRACITE_FRAMEWORKS,
  defaultUltraciteFrameworksFromFrontend,
  parseUltraciteFrameworksArg,
} from "../src/ultracite-framework";
import { parseUltraciteFrameworksFlag } from "../src/commands/shared/ultracite";

describe("parseUltraciteFrameworksArg", () => {
  test("parses comma-separated frameworks and dedupes", () => {
    expect(parseUltraciteFrameworksArg("react,next,react")).toEqual(["react", "next"]);
  });

  test("parses space-separated frameworks", () => {
    expect(parseUltraciteFrameworksArg("react next")).toEqual(["react", "next"]);
  });

  test("rejects unknown framework ids", () => {
    expect(() => parseUltraciteFrameworksArg("react,unknown")).toThrow(
      'Invalid framework "unknown"',
    );
  });
});

describe("defaultUltraciteFrameworksFromFrontend", () => {
  test("defaults to react and next for next frontend", () => {
    expect(defaultUltraciteFrameworksFromFrontend("next")).toEqual(DEFAULT_ULTRACITE_FRAMEWORKS);
  });
});

describe("parseUltraciteFrameworksFlag", () => {
  test("returns undefined when ultracite is off and flag omitted", () => {
    expect(parseUltraciteFrameworksFlag({}, false)).toBeUndefined();
  });

  test("throws when flag is set without ultracite add-on", () => {
    expect(() => parseUltraciteFrameworksFlag({ frameworks: "react" }, false)).toThrow(
      "--frameworks requires ultracite",
    );
  });
});
