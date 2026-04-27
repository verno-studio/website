import { TaggedError } from "better-result";

export class GeneratorError extends TaggedError("GeneratorError")<{
  message: string;
  phase?: string;
  cause?: unknown;
}>() {}
