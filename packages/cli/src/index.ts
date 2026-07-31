import process from "node:process";
import pc from "picocolors";
import { isCLIError, isUserCancelled, ProcessFailedError } from "./errors";
import { isTelemetryEnabled, trackException } from "./analytics";
import { buildProgram } from "./program";
import type { ProgramHandlers } from "./program";

const handlers: ProgramHandlers = {
  onCreate: async (name, opts) => {
    const { runCreate } = await import("./commands/create");
    const { toCreateCommandOptions } = await import("./commands/create/args");
    await runCreate({
      name,
      options: toCreateCommandOptions(opts),
    });
  },
  onDoctor: async (opts) => {
    const { runDoctor } = await import("./commands/doctor");
    const { toDoctorCommandOptions } = await import("./commands/doctor/args");
    await runDoctor({
      options: toDoctorCommandOptions(opts),
    });
  },
  onInit: async (opts) => {
    const { runInit } = await import("./commands/init");
    const { toInitCommandOptions } = await import("./commands/init/args");
    const merged = { ...opts, addons: (opts.addons ?? opts.addon) as string | undefined };
    await runInit({
      options: toInitCommandOptions(merged),
    });
  },
  onUpdate: async (opts) => {
    const { runUpdate } = await import("./commands/update");
    const { toUpdateCommandOptions } = await import("./commands/update/args");
    await runUpdate({
      options: toUpdateCommandOptions(opts),
    });
  },
};

const program = buildProgram(handlers);

const run = async (): Promise<void> => {
  if (isTelemetryEnabled()) {
    process.stderr.write(
      pc.dim(
        "Verno Studio collects usage data (including git identity when available). Set DO_NOT_TRACK=1 to opt out.\n",
      ),
    );
  }
  try {
    const argv = process.argv.slice(2);
    if (argv.length === 0) {
      program.outputHelp();
      process.exitCode = 0;
      return;
    }
    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    if (isUserCancelled(error)) {
      process.exit(0);
    }
    if (isCLIError(error)) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(error.exitCode);
    }
    if (error instanceof ProcessFailedError) {
      process.stderr.write(`Error: ${error.message}\n`);
      if (error.cause !== undefined) {
        process.stderr.write(`${String(error.cause)}\n`);
      }
      await trackException(error);
      process.exit(1);
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    await trackException(error);
    process.exit(1);
  }
};

await run();
