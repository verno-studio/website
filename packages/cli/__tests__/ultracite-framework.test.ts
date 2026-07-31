import { describe, expect, test } from "bun:test";
import { parseUltraciteFrameworksArg } from "../src/ultracite-framework";
import { parseUltraciteFrameworksFlag } from "../src/commands/shared/ultracite";

describe("parseUltraciteFrameworksArg", () => {
  test("parses comma-separated frameworks and dedupes", () => {
    expect(parseUltraciteFrameworksArg("react,next,react")).toEqual(["react", "next"]);
  });

  test("parses space-separated frameworks", () => {
    expect(parseUltraciteFrameworksArg("react next")).toEqual(["react", "next"]);
  });

  test("passes unknown framework ids through with a warning", () => {
    const stderrChunks: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: unknown) => {
      stderrChunks.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      expect(parseUltraciteFrameworksArg("react,nuxt")).toEqual(["react", "nuxt"]);
    } finally {
      process.stderr.write = originalWrite;
    }

    expect(stderrChunks.join("")).toContain('"nuxt"');
    expect(stderrChunks.join("")).toContain("passing through");
  });

  test("does not warn for known framework ids", () => {
    const stderrChunks: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: unknown) => {
      stderrChunks.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      expect(parseUltraciteFrameworksArg("react,next")).toEqual(["react", "next"]);
    } finally {
      process.stderr.write = originalWrite;
    }

    expect(stderrChunks).toEqual([]);
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
