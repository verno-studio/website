import { isCLIError, isUserCancelled, ProcessFailedError } from "./errors";
import { runCreate } from "./commands/create";

const showGlobalHelp = (): void => {
  process.stdout.write(`
verno — Verno CLI

Usage:
  verno <command> [options]

Commands:
  create <name>   Scaffold a Next.js app or Turborepo monorepo

Run \`verno create --help\` for options.
`);
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const [cmd, ...rest] = argv;
  const isGlobalHelp = argv.length === 0 || cmd === "help" || cmd === "--help" || cmd === "-h";
  if (isGlobalHelp) {
    showGlobalHelp();
    return;
  }

  if (cmd === "create") {
    await runCreate(rest);
    return;
  }

  process.stderr.write(`Unknown command: ${String(cmd)}\n`);
  showGlobalHelp();
  process.exit(1);
};

const run = async (): Promise<void> => {
  try {
    await main();
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
      process.exit(1);
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
};

await run();
