import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { VERNO_APP_GLOBALS_BASE_LAYER, VERNO_APP_GLOBALS_BASE_MARKER } from "../src/constants";

const HBS_PATH = path.join(
  import.meta.dir,
  "..",
  "..",
  "template-generator",
  "templates",
  "frontends",
  "next",
  "app",
  "globals.css.hbs",
);

const readTemplate = (): string => readFileSync(HBS_PATH, "utf-8");

/** The block the scaffold writes, without the handlebars guard around it. */
const templateBaseLayer = (): string => {
  const source = readTemplate();
  const start = source.indexOf(VERNO_APP_GLOBALS_BASE_MARKER);
  expect(start).toBeGreaterThanOrEqual(0);
  return source
    .slice(start)
    .replace(/\{\{\/if\}\}\s*$/u, "")
    .trimEnd();
};

describe("app globals base layer contract", () => {
  test("constants.ts matches the template — a failure means one was edited without the other", () => {
    expect(VERNO_APP_GLOBALS_BASE_LAYER.trimEnd()).toBe(templateBaseLayer());
  });

  test("the block carries no handlebars — the CLI writes it verbatim, after interpolation is over", () => {
    expect(templateBaseLayer()).not.toContain("{{");
  });

  test("the block is guarded by useShadcn — its utilities do not exist without the contract", () => {
    const source = readTemplate();
    // `shadcn apply` writes the token contract these utilities resolve against,
    // so the block only makes sense when shadcn is on.
    const guard = source.lastIndexOf("{{#if useShadcn}}");
    expect(guard).toBeGreaterThanOrEqual(0);
    expect(guard).toBeLessThan(source.indexOf(VERNO_APP_GLOBALS_BASE_MARKER));
    expect(source.trimEnd().endsWith("{{/if}}")).toBe(true);
  });

  test("the block applies no utility outside the shadcn token contract", () => {
    // `@apply` on an undefined utility fails the whole build, not just the rule.
    const applied = [...templateBaseLayer().matchAll(/@apply (?<utilities>[^;]+);/gu)]
      .flatMap((match) => (match.groups?.utilities ?? "").split(/\s+/u))
      .filter(Boolean);
    // Not tracking-tight/-tighter: Tailwind ships both, the theme only reprices them.
    const outsideContract = new Set(["font-heading", "tracking-snug"]);
    expect(applied.filter((utility) => outsideContract.has(utility))).toEqual([]);
  });

  test("every var() outside the shadcn contract carries a fallback", () => {
    // These are guaranteed either way; anything else needs the package to exist.
    const contract = new Set([
      "--background",
      "--foreground",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--input",
      "--ring",
      "--radius",
    ]);
    const bare = [...templateBaseLayer().matchAll(/var\((?<name>--[\w-]+)\)/gu)]
      .map((match) => match.groups?.name ?? "")
      .filter((name) => name && !contract.has(name));
    expect(bare).toEqual([]);
  });
});
