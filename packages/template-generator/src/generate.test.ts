import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { access, constants, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ProjectConfig } from "./config";
import { defaultNpmScopeFromProjectName, generate, writeTree } from "./index";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "verno-tg-"));
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

const monorepoWithDs = (overrides: Partial<ProjectConfig> = {}): ProjectConfig =>
  singleApp({
    addons: ["turborepo", "ultracite"],
    codeQuality: "oxlint-oxfmt",
    npmScope: "mono",
    packages: ["typescript-config", "design-system"],
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

describe("defaultNpmScopeFromProjectName", () => {
  test("slugifies and strips invalid characters", () => {
    expect(defaultNpmScopeFromProjectName("My App!")).toBe("my-app");
  });
});

describe("generate + writeTree", () => {
  test("single Next app writes key files", async () => {
    const out = join(dir, "next-app");
    const config = singleApp({
      addons: ["ultracite"],
      codeQuality: "oxlint-oxfmt",
      npmScope: "testapp",
      projectName: "test-app",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    expect(tree.fileCount).toBeGreaterThan(0);
    const writeResult = await writeTree(tree, out);
    const filesWritten = writeResult.unwrap();
    expect(filesWritten.length).toBeGreaterThan(0);
    await access(join(out, "package.json"), constants.R_OK);
    await access(join(out, "app", "page.tsx"), constants.R_OK);
    await access(join(out, "next.config.ts"), constants.R_OK);
    const pkgRaw = await readFile(join(out, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw) as { devDependencies?: Record<string, string> };
    expect(pkg.devDependencies?.ultracite).toBeDefined();
    const globalsCss = await readFile(join(out, "app", "globals.css"), "utf-8");
    expectSingleAppGlobalsBaseLayer(globalsCss);
  });

  test("Turborepo writes monorepo layout", async () => {
    const out = join(dir, "mono");
    const config = monorepoWithDs({ npmScope: "mono", projectName: "mono" });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();
    await access(join(out, "turbo.json"), constants.R_OK);
    await access(join(out, "apps", "web", "package.json"), constants.R_OK);
    await access(join(out, "packages", "typescript-config", "base.json"), constants.R_OK);
    await access(join(out, "packages", "design-system", "package.json"), constants.R_OK);
    const rootPkgRaw = await readFile(join(out, "package.json"), "utf-8");
    const rootPkg = JSON.parse(rootPkgRaw) as { devDependencies?: Record<string, string> };
    expect(rootPkg.devDependencies?.ultracite).toBeDefined();
  });

  test("monorepo writes design-system shadcn config and app imports design-system CSS", async () => {
    const out = join(dir, "mono-ds");
    const ds = "@acme/design-system";
    const config = monorepoWithDs({
      npmScope: "acme",
      projectName: "my-app",
      shadcnPreset: "lyra",
    });
    const gen = generate({ config });
    const tree = gen.unwrap();
    const writeResult = await writeTree(tree, out);
    writeResult.unwrap();
    const componentsJson = await readFile(
      join(out, "packages", "design-system", "components.json"),
      "utf-8",
    );
    expect(componentsJson).toContain(`"style": "radix-lyra"`);
    expect(componentsJson).toContain(`"components": "${ds}/components"`);

    const appCss = await readFile(join(out, "apps", "web", "app", "globals.css"), "utf-8");
    expect(appCss).toContain(`@import "${ds}/styles/globals.css";`);
    expectSingleAppGlobalsBaseLayer(appCss);

    const dsGlobals = await readFile(
      join(out, "packages", "design-system", "styles", "globals.css"),
      "utf-8",
    );
    expect(dsGlobals).toContain(`@import "shadcn/tailwind.css";`);
    expect(dsGlobals).not.toContain(vernoAppGlobalsBaseMarker);

    const utils = await readFile(
      join(out, "packages", "design-system", "lib", "utils.ts"),
      "utf-8",
    );
    expect(utils).toContain("export const cn");
  });
});
