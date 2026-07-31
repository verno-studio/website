import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { restructureForTurborepo } from "../src/commands/init/actions";

const TEST_DIR = path.join(
  tmpdir(),
  `verno-init-restructure-test-${Math.random().toString(36).slice(2)}`,
);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { force: true, recursive: true });
});

const NEXT_SCRIPTS = {
  build: "next build",
  dev: "next dev",
  lint: "next lint",
  start: "next start",
};

const writeCleanNextFixture = (): void => {
  mkdirSync(path.join(TEST_DIR, "app"), { recursive: true });
  writeFileSync(
    path.join(TEST_DIR, "app", "page.tsx"),
    "export default function Page() { return null; }\n",
  );
  writeFileSync(path.join(TEST_DIR, "next.config.ts"), "export default {};\n");
  writeFileSync(path.join(TEST_DIR, "tsconfig.json"), '{"compilerOptions":{}}\n');
  writeFileSync(
    path.join(TEST_DIR, "package.json"),
    JSON.stringify({ name: "my-app", scripts: NEXT_SCRIPTS }, null, 2),
  );
};

/** Recursively lists relative paths (files and dirs) under `dir`, sorted, using posix separators. */
const walk = (dir: string, base = dir): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = fullPath
      .slice(base.length + 1)
      .split(path.sep)
      .join("/");
    results.push(relPath);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, base));
    }
  }
  return results.toSorted();
};

/** Runs `fn` while collecting everything written to stderr. */
const captureStderr = async (fn: () => Promise<void>): Promise<string[]> => {
  const chunks: string[] = [];
  const originalWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = ((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    await fn();
  } finally {
    process.stderr.write = originalWrite;
  }
  return chunks;
};

describe("restructureForTurborepo", () => {
  test("moves a clean Next.js app into apps/web and sets up turbo scripts", async () => {
    writeCleanNextFixture();

    await restructureForTurborepo(TEST_DIR, "bun");

    expect(existsSync(path.join(TEST_DIR, "apps", "web", "app", "page.tsx"))).toBe(true);
    expect(existsSync(path.join(TEST_DIR, "apps", "web", "next.config.ts"))).toBe(true);
    expect(existsSync(path.join(TEST_DIR, "apps", "web", "tsconfig.json"))).toBe(true);
    expect(existsSync(path.join(TEST_DIR, "app"))).toBe(false);
    expect(existsSync(path.join(TEST_DIR, "next.config.ts"))).toBe(false);

    const rootPkg = JSON.parse(readFileSync(path.join(TEST_DIR, "package.json"), "utf-8"));
    expect(rootPkg.workspaces).toEqual(["apps/*", "packages/*"]);
    expect(rootPkg.scripts.build).toBe("turbo run build");
    expect(rootPkg.scripts.dev).toBe("turbo run dev");
    expect(rootPkg.scripts.lint).toBe("turbo run lint");
  });

  test("preserves the root start script instead of dropping it", async () => {
    writeCleanNextFixture();

    await restructureForTurborepo(TEST_DIR, "bun");

    const rootPkg = JSON.parse(readFileSync(path.join(TEST_DIR, "package.json"), "utf-8"));
    expect(rootPkg.scripts.start).toBe("next start");
  });

  test("does not clobber an existing turbo.json", async () => {
    writeCleanNextFixture();
    const existingTurboJson = `${JSON.stringify({ tasks: { custom: {} } }, null, 2)}\n`;
    writeFileSync(path.join(TEST_DIR, "turbo.json"), existingTurboJson);

    const stderrChunks = await captureStderr(() => restructureForTurborepo(TEST_DIR, "bun"));

    const afterContent = readFileSync(path.join(TEST_DIR, "turbo.json"), "utf-8");
    expect(afterContent).toBe(existingTurboJson);
    expect(stderrChunks.some((chunk) => chunk.includes("turbo.json"))).toBe(true);
  });

  test("does not clobber an existing apps/web/package.json", async () => {
    writeCleanNextFixture();
    mkdirSync(path.join(TEST_DIR, "apps", "web"), { recursive: true });
    const existingWebPkg = `${JSON.stringify({ name: "custom-web", version: "9.9.9" }, null, 2)}\n`;
    writeFileSync(path.join(TEST_DIR, "apps", "web", "package.json"), existingWebPkg);

    const stderrChunks = await captureStderr(() => restructureForTurborepo(TEST_DIR, "bun"));

    const afterContent = readFileSync(path.join(TEST_DIR, "apps", "web", "package.json"), "utf-8");
    expect(afterContent).toBe(existingWebPkg);
    expect(stderrChunks.some((chunk) => chunk.includes("package.json"))).toBe(true);
  });

  test("generates a self-contained turbo.json with no extends reference", async () => {
    writeCleanNextFixture();

    await restructureForTurborepo(TEST_DIR, "bun");

    const turboJson = JSON.parse(readFileSync(path.join(TEST_DIR, "turbo.json"), "utf-8"));
    expect(turboJson.extends).toBeUndefined();
    expect(turboJson.$schema).toBe("https://turborepo.dev/schema.json");
  });

  test("is idempotent: running twice leaves the tree identical to running once", async () => {
    writeCleanNextFixture();

    await restructureForTurborepo(TEST_DIR, "bun");
    const treeAfterFirst = walk(TEST_DIR);
    const pkgAfterFirst = readFileSync(path.join(TEST_DIR, "package.json"), "utf-8");

    await restructureForTurborepo(TEST_DIR, "bun");
    const treeAfterSecond = walk(TEST_DIR);
    const pkgAfterSecond = readFileSync(path.join(TEST_DIR, "package.json"), "utf-8");

    expect(treeAfterSecond).toEqual(treeAfterFirst);
    expect(pkgAfterSecond).toBe(pkgAfterFirst);
  });
});
