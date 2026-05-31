import process from "node:process";
import { Command } from "commander";
import pc from "picocolors";
import packageJson from "../package.json";
import { isCLIError, isUserCancelled, ProcessFailedError } from "./errors";
import { isTelemetryEnabled, trackException } from "./analytics";

const program = new Command();

program
  .name("verno")
  .description(packageJson.description)
  .version(packageJson.version, "-v, --version");

program
  .command("create")
  .description("Scaffold a composable Next.js app (optional Turborepo + workspace packages)")
  .argument("[name]", "Project directory name")
  .option("-y, --yes", "Non-interactive mode (requires project name)", false)
  .option("--dry-run", "Print the plan without writing files or running hooks", false)
  .option("--frontend <id>", "next (default: next)", "next")
  .option("--addons <list>", "Comma-separated: turborepo, ultracite (e.g. turborepo,ultracite)")
  .option(
    "--packages <list>",
    "Comma-separated workspace packages when using turborepo: typescript-config, design-system",
  )
  .option("-p, --package-manager <pm>", "bun | pnpm | npm")
  .option("--ui <mode>", "shadcn | none")
  .option("--shadcn-preset <name>", "shadcn preset (e.g. nova)")
  .option(
    "--linter <id>",
    "biome | oxlint | eslint (ultracite add-on; -y default oxlint; interactive wizard asks unless set)",
  )
  .option("--no-install", "Skip dependency install")
  .option("--no-git", "Skip git init")
  .option("--skip-shadcn", "Skip shadcn bootstrap")
  .option("--skip-ultracite", "Skip ultracite add-on and ultracite init")
  .action(async (name: string | undefined, opts) => {
    const { runCreate } = await import("./commands/create");
    const { toCreateCommandOptions } = await import("./commands/create/args");
    await runCreate({
      name,
      options: toCreateCommandOptions(opts),
    });
  });

program
  .command("init")
  .description("Add components/addons to an existing Verno Studio project")
  .option("--addon <list>", "Comma-separated: turborepo, ultracite (e.g. turborepo,ultracite)")
  .option("--ui <mode>", "shadcn | none")
  .option("--shadcn-preset <name>", "shadcn preset (e.g. nova)")
  .option(
    "--linter <id>",
    "biome | oxlint | eslint (ultracite add-on; interactive wizard asks unless set)",
  )
  .option("-p, --package-manager <pm>", "bun | pnpm | npm")
  .option("-y, --yes", "Non-interactive mode", false)
  .option("--dry-run", "Print the plan without writing files", false)
  .option("--no-install", "Skip dependency install")
  .option("--skip-shadcn", "Skip shadcn bootstrap")
  .option("--skip-ultracite", "Skip ultracite add-on")
  .action(async (opts) => {
    const { runInit } = await import("./commands/init");
    const { toInitCommandOptions } = await import("./commands/init/args");
    await runInit({
      options: toInitCommandOptions(opts),
    });
  });

program
  .command("doctor")
  .description("Audit and verify a Verno Studio project's health and configuration")
  .option("-y, --yes", "Automatically apply fixes without prompting", false)
  .option("--fix", "Attempt to fix any autofixable issues automatically", false)
  .option("-p, --package-manager <pm>", "Override package manager for dependency operations")
  .action(async (opts) => {
    const { runDoctor } = await import("./commands/doctor");
    const { toDoctorCommandOptions } = await import("./commands/doctor/args");
    await runDoctor({
      options: toDoctorCommandOptions(opts),
    });
  });

program
  .command("update")
  .description(
    "Update a Verno Studio project's configuration and dependencies to the latest version",
  )
  .option("-y, --yes", "Automatically apply updates without prompting", false)
  .option("--dry-run", "Preview changes without applying them", false)
  .option("--no-install", "Skip dependency install")
  .option("-p, --package-manager <pm>", "Override package manager for dependency operations")
  .action(async (opts) => {
    const { runUpdate } = await import("./commands/update");
    const { toUpdateCommandOptions } = await import("./commands/update/args");
    await runUpdate({
      options: toUpdateCommandOptions(opts),
    });
  });

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
