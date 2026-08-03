import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "bun:test";

const ROOT = path.join(import.meta.dirname, "..", "..", "..");
const REGISTRY = path.join(ROOT, "packages", "design-system", "registry.json");
const GEIST = path.join(ROOT, "apps", "web", "styles", "geist.css");

const DECLARATION = /^\s*--(?<name>json-[\w-]+)\s*:\s*(?<value>[^;]+);/gmu;

/**
 * The published values and the ones this site runs on are two copies of the
 * same contract: the registry ships literals, and geist.css cannot map them
 * onto `--ds-*` without changing what a reader sees. Copies drift, so the
 * drift is what gets tested.
 */
const declared = (css: string) => {
  const blocks = new Map<string, Record<string, string>>();
  const light = css.slice(css.indexOf("\n:root {"), css.indexOf("\n.dark {"));
  const dark = css.slice(css.indexOf("\n.dark {"));

  for (const [scope, body] of [
    ["light", light],
    ["dark", dark],
  ] as const) {
    const vars: Record<string, string> = {};

    for (const { groups } of body.matchAll(DECLARATION)) {
      if (groups?.name && groups.value) {
        vars[groups.name] = groups.value.trim();
      }
    }

    blocks.set(scope, vars);
  }

  return blocks;
};

describe("json-view tokens", () => {
  const registry = JSON.parse(readFileSync(REGISTRY, "utf-8")) as {
    items: { name: string; cssVars?: Record<string, Record<string, string>> }[];
  };
  const item = registry.items.find((entry) => entry.name === "json-view");
  const site = declared(readFileSync(GEIST, "utf-8"));

  test("the registry item carries its own syntax roles", () => {
    expect(item).toBeDefined();
    expect(Object.keys(item?.cssVars?.light ?? {}).toSorted()).toEqual([
      "json-boolean",
      "json-highlight",
      "json-highlight-foreground",
      "json-key",
      "json-number",
      "json-string",
    ]);
  });

  for (const scope of ["light", "dark"] as const) {
    test(`the site renders the published ${scope} values`, () => {
      expect(site.get(scope)).toEqual(item?.cssVars?.[scope] ?? {});
    });
  }

  test("no syntax role leaks into the theme item", () => {
    const theme = registry.items.find((entry) => entry.name === "theme");
    const names = Object.values(theme?.cssVars ?? {}).flatMap((vars) => Object.keys(vars));

    expect(names.filter((name) => name.includes("json"))).toEqual([]);
  });
});
