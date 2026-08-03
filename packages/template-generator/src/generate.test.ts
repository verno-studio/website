import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { access, constants, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ProjectConfig } from "./config";
import { buildInterpolatedFileTree } from "./generator";
import { defaultNpmScopeFromProjectName, generate, getRegistries, writeTree } from "./index";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "verno-tg-"));
});

afterEach(async () => {
  await rm(dir, { force: true, recursive: true });
});

const singleApp = (overrides: Partial<ProjectConfig> = {}): ProjectConfig => ({
  addons: [],
  frontend: "next",
  npmScope: "testapp",
  packageManager: "bun",
  packages: [],
  projectName: "test-app",
  ui: "none",
  ...overrides,
});

const monorepo = (overrides: Partial<ProjectConfig> = {}): ProjectConfig =>
  singleApp({
    addons: ["turborepo", "ultracite"],
    npmScope: "mono",
    packages: ["typescript-config"],
    projectName: "mono",
    shadcnPreset: "lyra",
    ...overrides,
  });

/** First line of the app-owned base block in `frontends/next/app/globals.css.hbs`. */
const vernoAppGlobalsBaseMarker = "/* This layer is by Verno Studio */" as const;

const expectSingleAppGlobalsBaseLayer = (globalsCss: string): void => {
  expect(globalsCss.split(vernoAppGlobalsBaseMarker).length - 1).toBe(1);
  expect(globalsCss.trimEnd().endsWith("}")).toBe(true);
};

/** With no design system and no shadcn, the layer's utilities do not exist — the app styles itself. */
const expectNoGlobalsBaseLayer = (globalsCss: string): void => {
  expect(globalsCss).not.toContain(vernoAppGlobalsBaseMarker);
  expect(globalsCss.trim()).toBe('@import "tailwindcss";');
};

describe("defaultNpmScopeFromProjectName", () => {
  test("slugifies and strips invalid characters", () => {
    expect(defaultNpmScopeFromProjectName("My App!")).toBe("my-app");
  });
});

describe("README.md", () => {
  test("monorepo renders ASCII tree, links, and dev command", () => {
    const config = monorepo({ packageManager: "pnpm", ui: "shadcn" });
    const files = buildInterpolatedFileTree(config);
    const readme = files["README.md"];
    expect(readme).toContain("# mono");
    expect(readme).toContain("─ Verno · Turborepo · Next.js · @mono");
    expect(readme).toContain("├── apps/web");
    expect(readme).toContain("packages/@mono/typescript-config");
    expect(readme).toContain("[shadcn/ui](https://ui.shadcn.com/docs)");
    expect(readme).toContain("[Turborepo](https://turborepo.dev/docs)");
    expect(readme).toContain("pnpm dev");
    expect(readme).not.toContain("ultracite");
    expect(readme).not.toContain("YOUR_PRESET_CODE");
  });

  test("single app renders shallow tree without shadcn when ui is none", () => {
    const config = singleApp({ packageManager: "bun" });
    const files = buildInterpolatedFileTree(config);
    const readme = files["README.md"];
    expect(readme).toContain("# test-app");
    expect(readme).toContain("─ Verno · Next.js · @testapp");
    expect(readme).toContain("├── app/");
    expect(readme).toContain("└── package.json");
    expect(readme).not.toContain("components.json");
    expect(readme).not.toContain("[shadcn/ui]");
    expect(readme).not.toContain("Turborepo");
    expect(readme).toContain("bun dev");
  });
});

describe("generate + writeTree", () => {
  test("single Next app writes key files", async () => {
    const out = path.join(dir, "next-app");
    const config = singleApp({
      addons: ["ultracite"],
      npmScope: "testapp",
      projectName: "test-app",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    expect(tree.fileCount).toBeGreaterThan(0);
    const writeResult = await writeTree(tree, out);
    const filesWritten = writeResult.unwrap();
    expect(filesWritten.length).toBeGreaterThan(0);
    await access(path.join(out, "package.json"), constants.R_OK);
    await access(path.join(out, "app", "page.tsx"), constants.R_OK);
    await access(path.join(out, "next.config.ts"), constants.R_OK);
    const pkgRaw = await readFile(path.join(out, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw) as { devDependencies?: Record<string, string> };
    expect(pkg.devDependencies?.ultracite).toBeDefined();
    const globalsCss = await readFile(path.join(out, "app", "globals.css"), "utf-8");
    expectNoGlobalsBaseLayer(globalsCss);
  });

  test("Turborepo writes monorepo layout", async () => {
    const out = path.join(dir, "mono");
    const config = monorepo({ npmScope: "mono", projectName: "mono" });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();
    await access(path.join(out, "turbo.json"), constants.R_OK);
    await access(path.join(out, "apps", "web", "package.json"), constants.R_OK);
    await access(path.join(out, "packages", "typescript-config", "base.json"), constants.R_OK);
    expect(existsSync(path.join(out, "packages", "design-system"))).toBe(false);
    const rootPkgRaw = await readFile(path.join(out, "package.json"), "utf-8");
    const rootPkg = JSON.parse(rootPkgRaw) as { devDependencies?: Record<string, string> };
    expect(rootPkg.devDependencies?.ultracite).toBeDefined();
  });

  test("monorepo writes the app's shadcn config, registry namespace and all", async () => {
    const out = path.join(dir, "mono-ds");
    const config = monorepo({
      npmScope: "acme",
      projectName: "my-app",
      shadcnPreset: "lyra",
      ui: "shadcn",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();
    // Next to the app it configures, not in a package of its own — shadcn
    // resolves components.json from its cwd and never searches downward.
    const componentsJson = await readFile(
      path.join(out, "apps", "web", "components.json"),
      "utf-8",
    );
    expect(componentsJson).toContain(`"style": "radix-lyra"`);
    expect(componentsJson).toContain(`"components": "@/components"`);
    // The registry namespace ships with the scaffold, so `shadcn add
    // @vernostudio/<name>` works in a fresh project without extra setup.
    expect(JSON.parse(componentsJson).registries).toEqual(getRegistries());

    const appCss = await readFile(path.join(out, "apps", "web", "app", "globals.css"), "utf-8");
    expect(appCss).not.toContain("design-system");
    expectSingleAppGlobalsBaseLayer(appCss);

    const utils = await readFile(path.join(out, "apps", "web", "lib", "utils.ts"), "utf-8");
    expect(utils).toContain("export const cn");
  });

  test("single-app ui shadcn writes typography + provider at app root", async () => {
    const out = path.join(dir, "root-ui-shadcn");
    const config = singleApp({
      addons: ["ultracite"],
      projectName: "test-app",
      ui: "shadcn",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();

    await access(path.join(out, "lib", "fonts.ts"), constants.R_OK);
    await access(path.join(out, "lib", "utils.ts"), constants.R_OK);
    await access(path.join(out, "components", "providers", "client.tsx"), constants.R_OK);

    expect(existsSync(path.join(out, "packages", "design-system"))).toBe(false);

    const layout = await readFile(path.join(out, "app", "layout.tsx"), "utf-8");
    expect(layout).toContain("DesignSystemProvider");
    expect(layout).toContain("@/lib/fonts");
    expect(layout).toContain("className={fonts}");

    const fontsSrc = await readFile(path.join(out, "lib", "fonts.ts"), "utf-8");
    expect(fontsSrc).toContain("export const fonts");
  });

  test("monorepo ui shadcn keeps fonts and provider helpers in the app", async () => {
    const out = path.join(dir, "mono-ui-shadcn");
    const config = monorepo({
      npmScope: "mono",
      projectName: "mono",
      ui: "shadcn",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();

    expect(existsSync(path.join(out, "packages", "design-system"))).toBe(false);

    await access(path.join(out, "apps", "web", "lib", "fonts.ts"), constants.R_OK);
    await access(path.join(out, "apps", "web", "lib", "utils.ts"), constants.R_OK);
    await access(
      path.join(out, "apps", "web", "components", "providers", "client.tsx"),
      constants.R_OK,
    );

    const layout = await readFile(path.join(out, "apps", "web", "app", "layout.tsx"), "utf-8");
    expect(layout).toContain("DesignSystemProvider");
    expect(layout).toContain("@/lib/fonts");
    expect(layout).toContain("className={fonts}");
  });
});
