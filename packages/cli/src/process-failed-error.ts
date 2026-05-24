export class ProcessFailedError extends Error {
  public readonly exitCode: number;
  public readonly signal: NodeJS.Signals | null;

  public readonly file: string;
  public readonly args: readonly string[];
  public readonly cwd: string;

  constructor(
    message: string,
    options: {
      readonly exitCode: number;
      readonly signal?: NodeJS.Signals | null;
      readonly file: string;
      readonly args: readonly string[];
      readonly cwd: string;
      readonly cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ProcessFailedError";
    this.exitCode = options.exitCode;
    this.signal = options.signal ?? null;
    this.file = options.file;
    this.args = options.args;
    this.cwd = options.cwd;
  }
}

export const isProcessFailed = (e: unknown): e is ProcessFailedError =>
  e instanceof ProcessFailedError;
