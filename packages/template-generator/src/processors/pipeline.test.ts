import { describe, expect, test } from "bun:test";
import { runPostProcessPipeline } from "./pipeline";
import type { FileTreeProcessor } from "./pipeline";

const pipelineAppendOne: FileTreeProcessor = (tree) => ({ ...tree, "a.txt": "1" });

const pipelineAppendTwo: FileTreeProcessor = (tree) => ({
  ...tree,
  "a.txt": `${tree["a.txt"]}2`,
});

describe("runPostProcessPipeline", () => {
  test("runs processors in order", () => {
    const config = {
      npmScope: "x",
      packageManager: "bun" as const,
      projectName: "p",
      template: "next-app" as const,
    };
    const out = runPostProcessPipeline({}, config, [pipelineAppendOne, pipelineAppendTwo]);
    expect(out["a.txt"]).toBe("12");
  });
});
