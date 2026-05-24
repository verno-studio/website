import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { toDoctorCommandOptions, resolveDoctorInputs } from "../src/commands/doctor/args";
import { runFullAudit } from "../src/commands/doctor/audit";
import { applyFixes } from "../src/commands/doctor/fix";

const TEST_DIR = join(tmpdir(), `verno-doctor-test-${Math.random().toString(36).slice(2)}`);

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { force: true, recursive: true });
});

describe("Doctor Args Parser", () => {
  test("toDoctorCommandOptions normalizes flags", () => {
    const o = toDoctorCommandOptions({
      fix: true,
      packageManager: "pnpm",
      yes: true,
    });
    expect(o.fix).toBe(true);
    expect(o.yes).toBe(true);
    expect(o.packageManager).toBe("pnpm");
  });

  test("resolveDoctorInputs resolves flags", () => {
    const r = resolveDoctorInputs({
      fix: false,
      packageManager: "bun",
      yes: true,
    });
    // yes implies fix
    expect(r.fix).toBe(true);
    expect(r.packageManager).toBe("bun");
    expect(r.yes).toBe(true);
  });
});

describe("Doctor Audit & Fix Actions", () => {
  test("runs checks on empty directory and detects missing manifest & package.json", () => {
    const diagnostics = runFullAudit(TEST_DIR);
    const manifestDiag = diagnostics.find((d) => d.id === "manifest-missing");
    const pkgDiag = diagnostics.find((d) => d.id === "package-json-missing");

    expect(manifestDiag).toBeDefined();
    expect(manifestDiag?.severity).toBe("warning");
    expect(pkgDiag).toBeDefined();
    expect(pkgDiag?.severity).toBe("error");
  });

  test("detects conflicting lockfiles", () => {
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({ name: "my-app", packageManager: "bun@1.0.0" }),
    );
    writeFileSync(join(TEST_DIR, "bun.lockb"), "");
    writeFileSync(join(TEST_DIR, "package-lock.json"), "");

    const diagnostics = runFullAudit(TEST_DIR);
    const lockfileDiag = diagnostics.find((d) => d.id === "lockfile-conflicts");

    expect(lockfileDiag).toBeDefined();
    expect(lockfileDiag?.severity).toBe("warning");
    expect(lockfileDiag?.fixable).toBe(true);
  });

  test("applies fixes to remove conflicting lockfiles", async () => {
    writeFileSync(
      join(TEST_DIR, "package.json"),
      JSON.stringify({ name: "my-app", packageManager: "bun@1.0.0" }),
    );
    writeFileSync(join(TEST_DIR, "bun.lockb"), "");
    writeFileSync(join(TEST_DIR, "package-lock.json"), "");

    const diagnostics = runFullAudit(TEST_DIR);
    const results = await applyFixes(TEST_DIR, diagnostics, { packageManager: "bun" });

    expect(results.some((r) => r.success)).toBe(true);
    expect(existsSync(join(TEST_DIR, "package-lock.json"))).toBe(false);
    expect(existsSync(join(TEST_DIR, "bun.lockb"))).toBe(true);
  });

  test("reconstructs missing manifest file", async () => {
    writeFileSync(join(TEST_DIR, "package.json"), JSON.stringify({ name: "my-app" }));

    const diagnostics = runFullAudit(TEST_DIR);
    const results = await applyFixes(TEST_DIR, diagnostics, {});

    expect(results.some((r) => r.id === "manifest-missing" && r.success)).toBe(true);
    expect(existsSync(join(TEST_DIR, ".verno", "manifest.json"))).toBe(true);
  });
});
