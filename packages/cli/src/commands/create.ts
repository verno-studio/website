import * as p from "@clack/prompts";
import { defaultNpmScopeFromProjectName } from "@verno/template-generator";
import { Result } from "better-result";
import pc from "picocolors";
import { errorToCreateJson, printJsonLine } from "../json-output";
import type { CreateJsonSuccessBody } from "../json-output";
import { getLogger } from "../logger";
import { dimPath, renderVernoTitle } from "../ui";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../errors";
import {
  getPmInstallCommand,
  getShadcnBootstrapCommand,
  getUltraciteInitCommand,
} from "../pm-exec";
import { runProcess } from "../run";
import { runInteractiveCreateWizard } from "./create-prompts";
import {
  DEFAULT_SHADCN_PRESET,
  parseCreateArgv,
  resolveCreateInputsNonInteractive,
} from "./create-args";
import type { ResolvedCreateInputs } from "./create-args";
import {
  assertPathAvailable,
  buildConfig,
  getProjectPath,
  getShadcnWorkingDirectory,
  runGitIfEnabled,
  runInstallIfEnabled,
  runShadcnIfEnabled,
  runUltraciteIfEnabled,
  scaffold,
} from "./create-actions";
import { getNextStepHints } from "./create-next-steps";
import { buildCreatePlan, getPlanSummary } from "./create-plan";

const showCreateHelp = (): void => {
  process.stdout.write(`
Usage: verno create <project-name> [options]

Options:
  -T, --template <id>         next-app | next-turborepo
  -p, --package-manager <pm>  bun | pnpm | npm (default: bun)
      --ui <mode>            shadcn | none (default: shadcn)
      --shadcn-preset <name>  shadcn preset, e.g. nova (default: ${DEFAULT_SHADCN_PRESET})
      --no-install
      --no-git
  -y, --yes
      --skip-shadcn
      --skip-ultracite
      --dry-run               Print the plan; do not write files or run hooks
      --json                  Output a single JSON object on stdout (use with -y and a name)
  -h, --help
`);
};

const buildSuccessJson = (args: {
  dryRun: boolean;
  filesWritten?: number;
  projectDir: string;
  projectName: string;
  plan: CreateJsonSuccessBody["data"]["plan"];
  nextSteps: readonly string[];
  resolved: {
    doGit: boolean;
    doInstall: boolean;
    packageManager: string;
    runUltracite: boolean;
    shadcnPreset: string;
    template: string;
    useShadcn: boolean;
  };
}): CreateJsonSuccessBody => ({
  data: {
    doGit: args.resolved.doGit,
    doInstall: args.resolved.doInstall,
    dryRun: args.dryRun,
    filesWritten: args.filesWritten,
    nextSteps: args.nextSteps,
    packageManager: args.resolved.packageManager,
    plan: args.plan,
    projectDir: args.projectDir,
    projectName: args.projectName,
    runUltracite: args.resolved.runUltracite,
    shadcnPreset: args.resolved.shadcnPreset,
    template: args.resolved.template,
    useShadcn: args.resolved.useShadcn,
  },
  ok: true,
});

const printHumanDryRun = (args: {
  projectDir: string;
  projectName: string;
  nextSteps: readonly string[];
  plan: CreateJsonSuccessBody["data"]["plan"];
}): void => {
  renderVernoTitle(false);
  process.stdout.write(`\n${pc.magenta("create — plan (dry run)")}\n\n`);
  process.stdout.write(`Project: ${args.projectName}\n`);
  process.stdout.write(`Path:    ${dimPath(args.projectDir, false)}\n\n`);
  for (const step of args.plan.steps) {
    if (step.willRun) {
      const cmd = step.command
        ? ` → ${step.command.file} ${step.command.args.join(" ")} (cwd: ${step.command.cwd})`
        : "";
      process.stdout.write(`  [ ] ${step.label}${cmd}\n`);
    } else {
      process.stdout.write(
        `  [skip] ${step.label}${step.skippedReason ? ` — ${step.skippedReason}` : ""}\n`,
      );
    }
  }
  process.stdout.write(`\nNext (after a real run):\n`);
  for (const line of args.nextSteps) {
    process.stdout.write(`  - ${line}\n`);
  }
  process.stdout.write(`\nRun without --dry-run to create the project.\n`);
};

const printHumanNextSteps = (name: string, nextSteps: readonly string[]): void => {
  process.stdout.write(`\nDone. Next:\n`);
  for (const line of nextSteps) {
    process.stdout.write(`  ${line}\n`);
  }
  process.stdout.write(`\n`);
  p.outro(`Project "${name}" is ready.`);
};

export const runCreate = async (argv: string[]): Promise<void> => {
  const { positionals, values } = parseCreateArgv(argv);

  if (values.help) {
    showCreateHelp();
    return;
  }

  const jsonMode = values.json;
  const dryRun = values["dry-run"];
  const useYes = values.yes;

  if (jsonMode && !useYes) {
    printJsonLine(
      errorToCreateJson(
        new CLIError(
          "Use --json with -y, --yes and a project name. Interactive mode is not available with --json.",
          { code: "VALIDATION" },
        ),
      ),
    );
    process.exit(1);
  }

  let resolved: ResolvedCreateInputs;
  try {
    resolved = useYes
      ? resolveCreateInputsNonInteractive(positionals, values)
      : await runInteractiveCreateWizard({ originalArgv: argv, positionals, values });
  } catch (error) {
    if (isUserCancelled(error)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    if (jsonMode) {
      printJsonLine(errorToCreateJson(error));
      process.exit(1);
    }
    throw error;
  }

  const projectDir = getProjectPath(resolved.name);
  const { steps } = buildCreatePlan(resolved, projectDir);
  const plan = getPlanSummary(resolved, projectDir, steps);
  const nextSteps = getNextStepHints(resolved);

  if (dryRun) {
    try {
      assertPathAvailable(projectDir);
    } catch (error) {
      if (jsonMode) {
        printJsonLine(
          errorToCreateJson(
            error instanceof Error
              ? new CLIError(error.message, { cause: error, code: "VALIDATION" })
              : new CLIError(String(error), { code: "VALIDATION" }),
          ),
        );
        process.exit(1);
      }
      throw error;
    }
    if (jsonMode) {
      printJsonLine(
        buildSuccessJson({
          dryRun: true,
          nextSteps,
          plan,
          projectDir,
          projectName: resolved.name,
          resolved: {
            doGit: resolved.doGit,
            doInstall: resolved.doInstall,
            packageManager: resolved.packageManager,
            runUltracite: resolved.runUltracite,
            shadcnPreset: resolved.shadcnPreset,
            template: resolved.template,
            useShadcn: resolved.useShadcn,
          },
        }),
      );
    } else {
      printHumanDryRun({ nextSteps, plan, projectDir, projectName: resolved.name });
    }
    return;
  }

  const config = buildConfig({
    name: resolved.name,
    npmScope: defaultNpmScopeFromProjectName(resolved.name),
    packageManager: resolved.packageManager,
    projectDir,
    shadcnPreset: resolved.shadcnPreset,
    template: resolved.template,
  });

  if (jsonMode) {
    const result = await Result.tryPromise(async () => {
      assertPathAvailable(projectDir);
      const { filesWritten } = await scaffold(config);
      await runInstallIfEnabled(resolved.doInstall, resolved.packageManager, projectDir);
      await runShadcnIfEnabled({
        enabled: resolved.useShadcn,
        packageManager: resolved.packageManager,
        preset: resolved.shadcnPreset,
        projectDir,
        template: resolved.template,
      });
      await runUltraciteIfEnabled(resolved.runUltracite, resolved.packageManager, projectDir);
      await runGitIfEnabled(resolved.doGit, projectDir);
      return { filesWritten };
    });
    if (result.isErr()) {
      printJsonLine(errorToCreateJson(result.error));
      process.exit(1);
    }
    const { filesWritten } = result.value;
    printJsonLine(
      buildSuccessJson({
        dryRun: false,
        filesWritten,
        nextSteps,
        plan,
        projectDir,
        projectName: resolved.name,
        resolved: {
          doGit: resolved.doGit,
          doInstall: resolved.doInstall,
          packageManager: resolved.packageManager,
          runUltracite: resolved.runUltracite,
          shadcnPreset: resolved.shadcnPreset,
          template: resolved.template,
          useShadcn: resolved.useShadcn,
        },
      }),
    );
    return;
  }

  const log = getLogger(false);
  try {
    assertPathAvailable(projectDir);
    await p.tasks([
      {
        task: async (message) => {
          const { filesWritten: n } = await scaffold(config, (line) => {
            message?.(line);
          });
          return `Wrote ${String(n)} files.`;
        },
        title: "Scaffold project",
      },
      {
        enabled: resolved.doInstall,
        task: async (message) => {
          const { args: a, file: f } = getPmInstallCommand(resolved.packageManager);
          message?.(`${f} ${a.join(" ")}…`);
          await runProcess(f, a, { cwd: projectDir, stepId: "install" });
          return "Dependencies installed";
        },
        title: "Install dependencies",
      },
      {
        enabled: resolved.useShadcn,
        task: async (message) => {
          const sh = getShadcnBootstrapCommand(resolved.packageManager, {
            preset: resolved.shadcnPreset,
            template: resolved.template,
          });
          const cwd = getShadcnWorkingDirectory(projectDir, resolved.template);
          message?.("shadcn init…");
          await runProcess(sh.file, sh.args, { cwd, stepId: "shadcn" });
          return "shadcn init complete";
        },
        title: "shadcn init",
      },
      {
        enabled: resolved.runUltracite,
        task: async (message) => {
          const u = getUltraciteInitCommand(resolved.packageManager);
          message?.("ultracite init…");
          await runProcess(u.file, u.args, { cwd: projectDir, stepId: "ultracite" });
          return "ultracite init complete";
        },
        title: "ultracite init",
      },
      {
        enabled: resolved.doGit,
        task: async (message) => {
          message?.("git init…");
          await runProcess("git", ["init"], { cwd: projectDir, stepId: "git" });
          return "Git ready";
        },
        title: "git init",
      },
    ]);
  } catch (error) {
    if (error instanceof ProcessFailedError) {
      log.error(error.message);
    }
    if (error instanceof UserCancelledError) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    throw error;
  }
  printHumanNextSteps(resolved.name, nextSteps);
};
