import { describe, expect, test } from "bun:test";
import type { ProjectConfig } from "../config";
import { VirtualFileSystem } from "../core/virtual-fs";
import { runPostProcessPipeline } from "./pipeline";
import type { VirtualFileSystemProcessor } from "./pipeline";

const pipelineAppendOne: VirtualFileSystemProcessor = (vfs) => {
  vfs.writeFile("a.txt", "1");
};

const pipelineAppendTwo: VirtualFileSystemProcessor = (vfs) => {
  const cur = vfs.readFile("a.txt") ?? "";
  vfs.writeFile("a.txt", `${cur}2`);
};

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
    const vfs = new VirtualFileSystem();
    runPostProcessPipeline(vfs, minimalConfig, [pipelineAppendOne, pipelineAppendTwo]);
    expect(vfs.readFile("a.txt")).toBe("12");
  });
});
