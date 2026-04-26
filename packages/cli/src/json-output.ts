import { UnhandledException } from "better-result";
import type { CreatePlanSummary } from "./commands/create-plan";
import { CLIError, ProcessFailedError } from "./errors";

export interface CreateJsonErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
    step?: string;
    command?: { file: string; args: readonly string[]; cwd: string };
    cause?: string;
  };
}

export interface CreateJsonSuccessBody {
  ok: true;
  data: {
    projectName: string;
    projectDir: string;
    dryRun: boolean;
    template: string;
    packageManager: string;
    useShadcn: boolean;
    shadcnPreset: string;
    doInstall: boolean;
    doGit: boolean;
    runUltracite: boolean;
    filesWritten?: number;
    nextSteps: readonly string[];
    plan: CreatePlanSummary;
  };
}

export const printJsonLine = (value: CreateJsonErrorBody | CreateJsonSuccessBody): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

export const errorToCreateJson = (e: unknown): CreateJsonErrorBody => {
  if (UnhandledException.is(e)) {
    return errorToCreateJson(e.cause);
  }
  if (e instanceof ProcessFailedError) {
    return {
      error: {
        code: "PROCESS_FAILED",
        command: { args: e.args, cwd: e.cwd, file: e.file },
        message: e.message,
      },
      ok: false,
    };
  }
  if (e instanceof CLIError) {
    return {
      error: {
        cause: e.cause === undefined ? undefined : String(e.cause),
        code: e.code,
        message: e.message,
      },
      ok: false,
    };
  }
  const message = e instanceof Error ? e.message : String(e);
  return {
    error: { code: "UNKNOWN", message },
    ok: false,
  };
};
