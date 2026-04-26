import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { access, constants, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultNpmScopeFromProjectName, generateProject } from "./index";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "verno-tg-"));
});

afterEach(async () => {
  await rm(dir, { force: true, recursive: true });
});

describe("defaultNpmScopeFromProjectName", () => {
  test("slugifies and strips invalid characters", () => {
    expect(defaultNpmScopeFromProjectName("My App!")).toBe("my-app");
  });
});

describe("generateProject", () => {
  test("next-app writes key files", async () => {
    const out = join(dir, "next-app");
    const { filesWritten } = await generateProject({
      npmScope: "testapp",
      packageManager: "bun",
      projectDir: out,
      projectName: "test-app",
      template: "next-app",
    });
    expect(filesWritten.length).toBeGreaterThan(0);
    await access(join(out, "package.json"), constants.R_OK);
    await access(join(out, "app", "page.tsx"), constants.R_OK);
    await access(join(out, "next.config.ts"), constants.R_OK);
  });

  test("next-turborepo writes monorepo layout", async () => {
    const out = join(dir, "mono");
    await generateProject({
      npmScope: "mono",
      packageManager: "bun",
      projectDir: out,
      projectName: "mono",
      template: "next-turborepo",
    });
    await access(join(out, "turbo.json"), constants.R_OK);
    await access(join(out, "apps", "web", "package.json"), constants.R_OK);
    await access(join(out, "packages", "typescript-config", "base.json"), constants.R_OK);
    await access(join(out, "packages", "design-system", "package.json"), constants.R_OK);
  });

  test("next-turborepo writes design-system shadcn config and app imports design-system CSS", async () => {
    const out = join(dir, "mono-ds");
    const ds = "@acme/design-system";
    await generateProject({
      npmScope: "acme",
      packageManager: "bun",
      projectDir: out,
      projectName: "my-app",
      shadcnPreset: "lyra",
      template: "next-turborepo",
    });
    const componentsJson = await readFile(
      join(out, "packages", "design-system", "components.json"),
      "utf-8",
    );
    expect(componentsJson).toContain(`"style": "radix-nova"`);
    expect(componentsJson).toContain(`"components": "${ds}/components"`);

    const appCss = await readFile(join(out, "apps", "web", "app", "globals.css"), "utf-8");
    expect(appCss).toContain(`@import "${ds}/styles/globals.css";`);

    const dsGlobals = await readFile(
      join(out, "packages", "design-system", "styles", "globals.css"),
      "utf-8",
    );
    expect(dsGlobals).toContain(`@import "shadcn/tailwind.css";`);

    const utils = await readFile(
      join(out, "packages", "design-system", "lib", "utils.ts"),
      "utf-8",
    );
    expect(utils).toContain("export const cn");
  });
});
