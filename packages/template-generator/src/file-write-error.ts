import { TaggedError } from "better-result";

export class FileWriteError extends TaggedError("FileWriteError")<{
  message: string;
  path?: string;
  cause?: unknown;
}>() {}
