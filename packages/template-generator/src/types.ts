import type { ProjectConfig } from "./config";
import type { FileTree } from "./paths";

export class GeneratorError extends Error {
  readonly config?: ProjectConfig;

  constructor(
    message: string,
    options?: {
      readonly cause?: unknown;
      readonly config?: ProjectConfig;
    },
  ) {
    const cause = options?.cause;
    super(message, cause === undefined ? undefined : { cause });
    this.name = "GeneratorError";
    this.config = options?.config;
  }
}

export interface GenerateResult {
  readonly tree: FileTree;
  readonly fileCount: number;
  readonly config: ProjectConfig;
}
