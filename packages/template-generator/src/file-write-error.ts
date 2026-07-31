import { TaggedError } from "better-result";

// oxlint-disable-next-line unicorn/throw-new-error -- TaggedError is better-result's class factory; the autofix (inserting `new`) breaks it
export class FileWriteError extends TaggedError("FileWriteError")<{
  message: string;
  path?: string;
  cause?: unknown;
}>() {}
