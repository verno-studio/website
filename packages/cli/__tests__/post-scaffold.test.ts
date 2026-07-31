import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  getShadcnWorkingDirectory,
  shouldWriteDecoyConfig,
} from "../src/commands/shared/post-scaffold";

const TEST_DIR = join(tmpdir(), `verno-post-scaffold-test-${Math.random().toString(36).slice(2)}`);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { force: true, recursive: true });
});

describe("shouldWriteDecoyConfig", () => {
  test("returns true when no vite.config.ts exists (decoy written and removed)", () => {
    expect(shouldWriteDecoyConfig(TEST_DIR)).toBe(true);
  });

  test("returns false when a real vite.config.ts already exists (left untouched)", () => {
    writeFileSync(join(TEST_DIR, "vite.config.ts"), "export default { plugins: [] };\n");
    expect(shouldWriteDecoyConfig(TEST_DIR)).toBe(false);
  });
});

describe("getShadcnWorkingDirectory", () => {
  test("returns projectDir when not a monorepo with design-system", () => {
    expect(getShadcnWorkingDirectory(TEST_DIR, false)).toBe(TEST_DIR);
  });

  test("returns packages/design-system when monorepo with design-system", () => {
    expect(getShadcnWorkingDirectory(TEST_DIR, true)).toBe(
      join(TEST_DIR, "packages", "design-system"),
    );
  });
});
