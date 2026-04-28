import { describe, expect, test } from "bun:test";
import { runPostProcessPipeline } from "./pipeline";
import type { FileTreeProcessor } from "./pipeline";
import type { ProjectConfig } from "../config";

const pipelineAppendOne: FileTreeProcessor = (tree) => ({ ...tree, "a.txt": "1" });

const pipelineAppendTwo: FileTreeProcessor = (tree) => ({
  ...tree,
  "a.txt": `${tree["a.txt"]}2`,
});

const minimalConfig: ProjectConfig = {
  addons: [],
  frontend: "next",
  npmScope: "x",
  packageManager: "bun",
  packages: [],
  projectName: "p",
  ui: "none",
};

describe("runPostProcessPipeline", () => {
  test("runs processors in order", () => {
    const out = runPostProcessPipeline({}, minimalConfig, [pipelineAppendOne, pipelineAppendTwo]);
    expect(out["a.txt"]).toBe("12");
  });
});
