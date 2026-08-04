// Writes registry.json. Run it with `bun run generate:registry`; never hand-edit
// the output — the same rule the template layer registry follows.
//
// The item list below is the hand-authored part. The theme's `cssVars` are read
// straight out of styles/globals.css so the tokens we publish and the tokens in
// the stylesheet cannot drift: there is one place to edit a color, and it is the
// CSS.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const PACKAGE_ROOT = path.join(import.meta.dirname, "..");
const STYLESHEET = path.join(PACKAGE_ROOT, "styles", "globals.css");
const OUTPUT = path.join(PACKAGE_ROOT, "registry.json");

const REGISTRY_NAME = "vernostudio";
const HOMEPAGE = "https://verno-studio.vercel.app/components";

const cssBlock = (css: string, header: string): string => {
  const start = css.indexOf(header);
  if (start === -1) {
    throw new Error(`block not found in styles/globals.css: ${header}`);
  }
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") {
      depth += 1;
    } else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return css.slice(open + 1, i);
      }
    }
  }
  throw new Error(`unterminated block in styles/globals.css: ${header}`);
};

const DECLARATION = /^\s*--(?<name>[\w-]+)\s*:\s*(?<value>[^;]+);/gmu;
const WHITESPACE = /\s+/gu;

const declarations = (body: string): Record<string, string> => {
  const vars: Record<string, string> = {};
  for (const { groups } of body.matchAll(DECLARATION)) {
    if (groups?.name && groups.value) {
      vars[groups.name] = groups.value.replace(WHITESPACE, " ").trim();
    }
  }
  return vars;
};

const readCssVars = () => {
  const css = readFileSync(STYLESHEET, "utf-8");
  return {
    // `color-scheme` is a real property rather than a custom one, so it is set
    // here instead of being picked up by the declaration regex.
    dark: { ...declarations(cssBlock(css, "\n.dark {")), "color-scheme": "dark" },
    light: {
      ...declarations(cssBlock(css, ":root,\n.light")),
      ...declarations(cssBlock(css, "\n:root {")),
      "color-scheme": "light",
    },
    theme: declarations(cssBlock(css, "@theme inline")),
  };
};

// A component's own tokens ride with the component, not with the theme, so
// installing one does not quietly widen the other. The stylesheet stays the
// single place they are written down.
const OWNED_BY = /^(?:color-)?json-/u;

const partition = (vars: ReturnType<typeof readCssVars>) => {
  const kept: Record<string, Record<string, string>> = {};
  const taken: Record<string, Record<string, string>> = {};

  for (const [scope, entries] of Object.entries(vars)) {
    for (const [name, value] of Object.entries(entries)) {
      const target = OWNED_BY.test(name) ? taken : kept;
      target[scope] ??= {};
      (target[scope] as Record<string, string>)[name] = value;
    }
  }

  return { component: taken, theme: kept };
};

const { component: jsonViewVars, theme: themeVars } = partition(readCssVars());

const items = [
  {
    cssVars: themeVars,
    dependencies: ["tw-animate-css"],
    description:
      "The color scale plus the variables shadcn components read, so a component from " +
      "either registry agrees with the other on what --background means.",
    files: [],
    name: "theme",
    title: "Theme",
    type: "registry:theme",
  },
  {
    dependencies: [],
    description:
      "A directory listing with collapsible folders, built from nested disclosures rather " +
      "than a tree role.",
    files: [{ path: "components/file-tree.tsx", type: "registry:ui" }],
    name: "file-tree",
    title: "File Tree",
    type: "registry:ui",
  },
  {
    cssVars: jsonViewVars,
    dependencies: [],
    description:
      "A collapsible tree for inspecting a JSON payload, with syntax roles, search " +
      "highlighting and the full ARIA tree keyboard model.",
    files: [{ path: "components/json-view.tsx", type: "registry:ui" }],
    name: "json-view",
    title: "JSON View",
    type: "registry:ui",
  },
];

const registry = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  homepage: HOMEPAGE,
  items,
  name: REGISTRY_NAME,
};

writeFileSync(OUTPUT, `${JSON.stringify(registry, null, 2)}\n`);
process.stdout.write(`registry.json — ${items.length} items\n`);
