import { spawn } from "node:child_process";
import { once } from "node:events";
import { ProcessFailedError } from "./errors";

export interface RunProcessOptions {
  readonly cwd: string;
  readonly stdio?: "inherit" | "pipe";
  readonly stepId?: "install" | "shadcn" | "ultracite" | "git" | "unknown";
  readonly env?: NodeJS.ProcessEnv;
  /** When false, do not set `CI=1` (needed for child CLIs that treat CI as non-interactive). Default true. */
  readonly ciSafe?: boolean;
}

export const runProcess = async (
  file: string,
  args: readonly string[],
  options: RunProcessOptions,
): Promise<void> => {
  const base = { ...process.env, ...options.env };
  const env = options.ciSafe === false ? base : { ...base, CI: process.env.CI ?? "1" };

  const child = spawn(file, [...args], {
    cwd: options.cwd,
    env,
    stdio: options.stdio ?? "inherit",
  });

  const ac = new AbortController();

  const result = await Promise.race([
    once(child, "error", { signal: ac.signal })
      .then((ev) => ({ error: ev[0] as Error, type: "error" as const }))
      .catch(() => null),
    once(child, "close", { signal: ac.signal })
      .then((ev) => ({
        code: ev[0] as number | null,
        signal: ev[1] as NodeJS.Signals | null,
        type: "close" as const,
      }))
      .catch(() => null),
  ]);

  ac.abort();

  if (result === null) {
    return;
  }

  if (result.type === "error") {
    throw new ProcessFailedError(`Command ${file} ${args.join(" ")} failed to start`, {
      args,
      cause: result.error,
      cwd: options.cwd,
      exitCode: 1,
      file,
    });
  }

  if (result.code !== 0) {
    const exitCode = result.code ?? 1;
    const suffix = result.signal ? ` signal ${result.signal}` : ` code ${String(exitCode)}`;
    throw new ProcessFailedError(`Command ${file} ${args.join(" ")} failed with${suffix}`, {
      args,
      cwd: options.cwd,
      exitCode,
      file,
      signal: result.signal,
    });
  }
};
