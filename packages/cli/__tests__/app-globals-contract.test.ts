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

/** The block the scaffold writes: everything from the marker to end of file. */
const templateBaseLayer = (): string => {
  const source = readFileSync(HBS_PATH, "utf-8");
  const start = source.indexOf(VERNO_APP_GLOBALS_BASE_MARKER);
  expect(start).toBeGreaterThanOrEqual(0);
  return source.slice(start).trimEnd();
};

describe("app globals base layer contract", () => {
  test("constants.ts matches the template — a failure means one was edited without the other", () => {
    expect(VERNO_APP_GLOBALS_BASE_LAYER.trimEnd()).toBe(templateBaseLayer());
  });

  test("the block carries no handlebars — the CLI writes it verbatim, after interpolation is over", () => {
    expect(templateBaseLayer()).not.toContain("{{");
  });

  test("the block applies no utility the design-system package alone defines", () => {
    // A generated project can omit the design-system package. `@apply` on an
    // undefined utility fails the whole build, so the layer may only apply the
    // shadcn contract (which `shadcn init` writes) or a Tailwind built-in.
    const applied = [...templateBaseLayer().matchAll(/@apply (?<utilities>[^;]+);/gu)]
      .flatMap((match) => (match.groups?.utilities ?? "").split(/\s+/u))
      .filter(Boolean);
    const designSystemOnly = new Set([
      "font-heading",
      "tracking-snug",
      "tracking-tight",
      "tracking-tighter",
    ]);
    expect(applied.filter((utility) => designSystemOnly.has(utility))).toEqual([]);
  });

  test("every var() outside the shadcn contract carries a fallback", () => {
    // Contract variables are guaranteed either way — the design-system package
    // defines them, and `shadcn init` writes them when it is absent. Anything
    // else only exists with the package, so a bare var() silently loses its
    // value in a project generated without one.
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
