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
const ITEM_URL = (name: string) => `https://verno-studio.vercel.app/r/${name}.json`;

const BRAND_ICONS = ["astro", "nextjs", "pungrumpy", "tanstack", "turborepo", "vite"] as const;
const UI_ICONS = ["check", "chevron-right", "copy"] as const;

const iconFile = (name: string) => ({
  path: `components/icons/${name}.tsx`,
  target: `components/icons/${name}.tsx`,
  type: "registry:component" as const,
});

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
  const css = readFileSync(STYLESHEET, "utf8");
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

const items = [
  {
    dependencies: ["clsx", "tailwind-merge"],
    description: "Merges Tailwind classes without letting later ones lose to specificity.",
    files: [{ path: "lib/utils.ts", type: "registry:lib" }],
    name: "utils",
    title: "cn",
    type: "registry:lib",
  },
  {
    cssVars: readCssVars(),
    dependencies: ["tw-animate-css"],
    description:
      "The Geist-derived color scale plus the variables shadcn components read, so components from either registry agree on what --background means.",
    files: [],
    name: "theme",
    title: "Theme",
    type: "registry:theme",
  },
  {
    description: "Framework and brand marks, sized by className and colored by currentColor.",
    files: [...BRAND_ICONS, ...UI_ICONS].toSorted().map(iconFile),
    name: "icons",
    title: "Icons",
    type: "registry:component",
  },
  {
    description: "A button that copies a string and confirms it, for people and for screen readers.",
    files: [
      { path: "components/copy-button.tsx", type: "registry:ui" },
      // Bundled rather than pulled in through the `icons` item: copying a string
      // should not also install six framework logos.
      iconFile("check"),
      iconFile("copy"),
    ],
    name: "copy-button",
    registryDependencies: [ITEM_URL("utils")],
    title: "Copy Button",
    type: "registry:ui",
  },
  {
    description: "An external link styled for running text, with the target and rel already right.",
    files: [{ path: "components/prose-link.tsx", type: "registry:ui" }],
    name: "prose-link",
    registryDependencies: [ITEM_URL("utils")],
    title: "Prose Link",
    type: "registry:ui",
  },
  {
    dependencies: ["next-themes"],
    description: "Wires the dark variant to a class on <html>, following the system by default.",
    files: [
      {
        path: "components/providers/client.tsx",
        target: "components/providers/client.tsx",
        type: "registry:component",
      },
    ],
    name: "theme-provider",
    title: "Theme Provider",
    type: "registry:component",
  },
  {
    dependencies: ["next"],
    description:
      "Geist, Geist Mono and Libre Baskerville as CSS variables. Next.js only — it imports next/font/google.",
    docs: "Apply the exported `fonts` class to <html>. This is the one item here that will not work outside Next.js.",
    files: [{ path: "lib/fonts.ts", type: "registry:lib" }],
    name: "fonts",
    title: "Fonts",
    type: "registry:lib",
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
