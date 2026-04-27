import process from "node:process";
import { Command } from "commander";
import packageJson from "../package.json";
import { runCreate } from "./commands/create";
import { toCreateCommandOptions } from "./commands/create-args";
import { isCLIError, isUserCancelled, ProcessFailedError } from "./errors";

const program = new Command();

program
  .name("verno")
  .description(packageJson.description)
  .version(packageJson.version, "-v, --version");

program
  .command("create")
  .description("Scaffold a Next.js app or Turborepo monorepo")
  .argument("[name]", "Project directory name")
  .option("-y, --yes", "Non-interactive mode (requires project name)", false)
  .option("--dry-run", "Print the plan without writing files or running hooks", false)
  .option("-T, --template <id>", "next-app | next-turborepo")
  .option("-p, --package-manager <pm>", "bun | pnpm | npm")
  .option("--ui <mode>", "shadcn | none")
  .option("--shadcn-preset <name>", "shadcn preset (e.g. nova)")
  .option("--no-install", "Skip dependency install")
  .option("--no-git", "Skip git init")
  .option("--skip-shadcn", "Skip shadcn bootstrap")
  .option("--skip-ultracite", "Skip ultracite init")
  .action(async (name: string | undefined, opts) => {
    await runCreate({
      name,
      options: toCreateCommandOptions(opts),
    });
  });

const run = async (): Promise<void> => {
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
      process.exit(1);
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Error: ${message}\n`);
    process.exit(1);
  }
};

await run();
