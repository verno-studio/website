import { execa } from "execa";
import type { ExecaError } from "execa";
import { ProcessFailedError } from "./errors";

export interface RunProcessOptions {
  readonly cwd: string;
  readonly stdio?: "inherit" | "pipe";
  readonly stepId?: "install" | "shadcn" | "ultracite" | "git" | "unknown";
  readonly env?: NodeJS.ProcessEnv;
  /** When false, do not set `CI=1` (needed for child CLIs that treat CI as non-interactive). Default true. */
  readonly ciSafe?: boolean;
}

const isExecaError = (e: unknown): e is ExecaError =>
  e !== null && typeof e === "object" && "failed" in e && (e as ExecaError).failed === true;

export const runProcess = async (
  file: string,
  args: readonly string[],
  options: RunProcessOptions,
): Promise<void> => {
  const base = { ...process.env, ...options.env };
  const env = options.ciSafe === false ? base : { ...base, CI: process.env.CI ?? "1" };
  try {
    await execa(file, args, {
      cwd: options.cwd,
      env,
      reject: true,
      stdio: options.stdio ?? "inherit",
    });
  } catch (error: unknown) {
    if (isExecaError(error)) {
      const code = error.exitCode ?? 1;
      throw new ProcessFailedError(
        `Command ${file} ${args.join(" ")} failed with code ${String(code)}`,
        {
          args,
          cause: error,
          cwd: options.cwd,
          exitCode: code,
          file,
        },
      );
    }
    throw error;
  }
};
