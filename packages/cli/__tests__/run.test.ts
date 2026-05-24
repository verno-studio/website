import { describe, expect, test } from "bun:test";
import { isProcessFailed } from "../src/errors";
import { runProcess } from "../src/run";

describe("runProcess", () => {
  test("resolves when the command exits successfully", async () => {
    await expect(
      runProcess(process.execPath, ["-e", "process.exit(0)"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).resolves.toBeUndefined();
  });

  test("sets CI=1 by default", async () => {
    await expect(
      runProcess(process.execPath, ["-e", "process.exit(process.env.CI ? 0 : 2)"], {
        cwd: process.cwd(),
        env: { CI: undefined },
        stdio: "pipe",
      }),
    ).resolves.toBeUndefined();
  });

  test("rejects with ProcessFailedError when the command exits unsuccessfully", async () => {
    try {
      await runProcess(process.execPath, ["-e", "process.exit(7)"], {
        cwd: process.cwd(),
        stdio: "pipe",
      });
      throw new Error("Expected runProcess to reject");
    } catch (error) {
      expect(isProcessFailed(error)).toBe(true);
      if (isProcessFailed(error)) {
        expect(error.exitCode).toBe(7);
        expect(error.file).toBe(process.execPath);
      }
    }
  });
});
