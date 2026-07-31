import { describe, expect, test } from "bun:test";
import { toCreateCommandOptions } from "../src/commands/create/args";
import { toInitCommandOptions } from "../src/commands/init/args";
import { buildProgram } from "../src/program";
import type { ProgramHandlers } from "../src/program";

const noop = (): Promise<void> => Promise.resolve();

const captureCreate = async (argv: string[]): Promise<Record<string, unknown> | undefined> => {
  let captured: Record<string, unknown> | undefined;
  const handlers: ProgramHandlers = {
    onCreate: (_name, opts) => {
      captured = opts;
      return Promise.resolve();
    },
    onDoctor: noop,
    onInit: noop,
    onUpdate: noop,
  };
  const program = buildProgram(handlers);
  await program.parseAsync(argv, { from: "user" });
  return captured;
};

const captureInit = async (argv: string[]): Promise<Record<string, unknown> | undefined> => {
  let captured: Record<string, unknown> | undefined;
  const handlers: ProgramHandlers = {
    onCreate: noop,
    onDoctor: noop,
    onInit: (opts) => {
      captured = opts;
      return Promise.resolve();
    },
    onUpdate: noop,
  };
  const program = buildProgram(handlers);
  await program.parseAsync(argv, { from: "user" });
  return captured;
};

/** Mirrors the merge performed in the real `onInit` handler in `src/index.ts`. */
const mergeInitAddons = (
  opts: Record<string, unknown>,
): Record<string, unknown> & { readonly addons: string | undefined } => ({
  ...opts,
  addons: (opts.addons ?? opts.addon) as string | undefined,
});

describe("program wiring: create", () => {
  test("--no-install and --no-git are wired through to CreateCommandOptions", async () => {
    const captured = await captureCreate(["create", "my-app", "-y", "--no-install", "--no-git"]);
    expect(captured).toBeDefined();
    const options = toCreateCommandOptions(captured ?? {});
    expect(options.noInstall).toBe(true);
    expect(options.noGit).toBe(true);
  });

  test("without --no-install/--no-git, both resolve to false", async () => {
    const captured = await captureCreate(["create", "my-app", "-y"]);
    expect(captured).toBeDefined();
    const options = toCreateCommandOptions(captured ?? {});
    expect(options.noInstall).toBe(false);
    expect(options.noGit).toBe(false);
  });
});

describe("program wiring: init", () => {
  test("--addons is wired through to InitCommandOptions", async () => {
    const captured = await captureInit(["init", "--addons", "turborepo,ultracite", "-y"]);
    expect(captured).toBeDefined();
    const options = toInitCommandOptions(mergeInitAddons(captured ?? {}));
    expect(options.addons).toBe("turborepo,ultracite");
  });

  test("legacy --addon alias resolves the same as --addons", async () => {
    const captured = await captureInit(["init", "--addon", "turborepo", "-y"]);
    expect(captured).toBeDefined();
    const options = toInitCommandOptions(mergeInitAddons(captured ?? {}));
    expect(options.addons).toBe("turborepo");
  });

  test("--no-install is wired through to InitCommandOptions", async () => {
    const captured = await captureInit(["init", "--no-install", "-y"]);
    expect(captured).toBeDefined();
    const options = toInitCommandOptions(mergeInitAddons(captured ?? {}));
    expect(options.noInstall).toBe(true);
  });
});
