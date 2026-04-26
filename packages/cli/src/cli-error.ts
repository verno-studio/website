export type CLIErrorCode =
  | "USER_CANCELLED"
  | "VALIDATION"
  | "IO"
  | "SCAFFOLD"
  | "INSTALL"
  | "SHADCN"
  | "ULTRACITE"
  | "GIT"
  | "UNKNOWN";

export class CLIError extends Error {
  public readonly exitCode: number;
  public readonly code: CLIErrorCode;
  public override cause?: unknown;

  constructor(
    message: string,
    options: {
      readonly code?: CLIErrorCode;
      readonly exitCode?: number;
      readonly cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = "CLIError";
    this.code = options.code ?? "UNKNOWN";
    this.exitCode = options.exitCode ?? 1;
    this.cause = options.cause;
  }
}

export const isCLIError = (e: unknown): e is CLIError => e instanceof CLIError;
