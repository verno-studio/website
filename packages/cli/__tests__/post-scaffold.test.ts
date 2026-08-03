import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import {
  getShadcnWorkingDirectory,
  shouldWriteDecoyConfig,
} from "../src/commands/shared/post-scaffold";

const TEST_DIR = path.join(
  tmpdir(),
  `verno-post-scaffold-test-${Math.random().toString(36).slice(2)}`,
);

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
    writeFileSync(path.join(TEST_DIR, "vite.config.ts"), "export default { plugins: [] };\n");
    expect(shouldWriteDecoyConfig(TEST_DIR)).toBe(false);
  });
});

describe("getShadcnWorkingDirectory", () => {
  test("returns projectDir when not a monorepo", () => {
    expect(getShadcnWorkingDirectory(TEST_DIR, false)).toBe(TEST_DIR);
  });

  test("returns apps/web when a monorepo", () => {
    expect(getShadcnWorkingDirectory(TEST_DIR, true)).toBe(path.join(TEST_DIR, "apps", "web"));
  });
});
