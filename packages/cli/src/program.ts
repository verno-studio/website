import { Command } from "commander";
import packageJson from "../package.json";

export interface ProgramHandlers {
  readonly onCreate: (name: string | undefined, opts: Record<string, unknown>) => Promise<void>;
  readonly onInit: (opts: Record<string, unknown>) => Promise<void>;
  readonly onDoctor: (opts: Record<string, unknown>) => Promise<void>;
  readonly onUpdate: (opts: Record<string, unknown>) => Promise<void>;
}

export const buildProgram = (handlers: ProgramHandlers): Command => {
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
    .option(
      "--frameworks <list>",
      "Ultracite preset extends: react, next, solid, vue, ... (ultracite add-on; -y defaults react,next; interactive wizard asks)",
    )
    .option("--no-install", "Skip dependency install")
    .option("--no-git", "Skip git init")
    .option("--skip-shadcn", "Skip shadcn bootstrap")
    .option("--skip-ultracite", "Skip ultracite add-on and ultracite init")
    .action(async (name: string | undefined, opts) => await handlers.onCreate(name, opts));

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
    .option(
      "--frameworks <list>",
      "Ultracite preset extends: react, next, solid, vue, ... (ultracite add-on; -y defaults react,next; interactive wizard asks)",
    )
    .option("-p, --package-manager <pm>", "bun | pnpm | npm")
    .option("-y, --yes", "Non-interactive mode", false)
    .option("--dry-run", "Print the plan without writing files", false)
    .option("--no-install", "Skip dependency install")
    .option("--skip-shadcn", "Skip shadcn bootstrap")
    .option("--skip-ultracite", "Skip ultracite add-on")
    .action(async (opts) => await handlers.onInit(opts));

  program
    .command("doctor")
    .description("Audit and verify a Verno Studio project's health and configuration")
    .option("-y, --yes", "Automatically apply fixes without prompting", false)
    .option("--fix", "Attempt to fix any autofixable issues automatically", false)
    .option("-p, --package-manager <pm>", "Override package manager for dependency operations")
    .action(async (opts) => await handlers.onDoctor(opts));

  program
    .command("update")
    .description(
      "Update a Verno Studio project's configuration and dependencies to the latest version",
    )
    .option("-y, --yes", "Automatically apply updates without prompting", false)
    .option("--dry-run", "Preview changes without applying them", false)
    .option("--no-install", "Skip dependency install")
    .option("-p, --package-manager <pm>", "Override package manager for dependency operations")
    .action(async (opts) => await handlers.onUpdate(opts));

  return program;
};
