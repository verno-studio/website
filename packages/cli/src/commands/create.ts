import * as p from "@clack/prompts";
import { defaultNpmScopeFromProjectName } from "@verno/template-generator";
import pc from "picocolors";
import { dimPath, renderVernoTitle } from "../ui";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../errors";
import { runInteractiveCreateWizard } from "./create-prompts";
import { resolveCreateInputsNonInteractive } from "./create-args";
import type { CreateCommandOptions, ResolvedCreateInputs } from "./create-args";
import {
  assertPathAvailable,
  buildConfig,
  getProjectPath,
  runGitIfEnabled,
  runInstallIfEnabled,
  runShadcnIfEnabled,
  runUltraciteIfEnabled,
  scaffold,
} from "./create-actions";
import { getNextStepHints } from "./create-next-steps";
import { buildCreatePlan, getPlanSummary } from "./create-plan";
import type { CreatePlanSummary } from "./create-plan";

const printHumanDryRun = (args: {
  projectDir: string;
  projectName: string;
  nextSteps: readonly string[];
  plan: CreatePlanSummary;
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

const resolveInputs = async (args: {
  name?: string;
  options: CreateCommandOptions;
}): Promise<ResolvedCreateInputs> => {
  const { name, options } = args;
  const useYes = options.yes;

  if (useYes) {
    if (!name) {
      throw new CLIError(
        "Project name is required with -y, --yes. Example: verno create my-app -y",
        { code: "VALIDATION" },
      );
    }
    return resolveCreateInputsNonInteractive(name, options);
  }

  try {
    return await runInteractiveCreateWizard({ name, options });
  } catch (error) {
    if (isUserCancelled(error)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    throw error;
  }
};

export const runCreate = async (args: {
  name?: string;
  options: CreateCommandOptions;
}): Promise<void> => {
  const { options } = args;
  const { dryRun } = options;

  const resolved = await resolveInputs(args);

  const projectDir = getProjectPath(resolved.name);
  const { steps } = buildCreatePlan(resolved, projectDir);
  const plan = getPlanSummary(resolved, projectDir, steps);
  const nextSteps = getNextStepHints(resolved);

  if (dryRun) {
    assertPathAvailable(projectDir);
    printHumanDryRun({ nextSteps, plan, projectDir, projectName: resolved.name });
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
          message?.("Installing dependencies…");
          await runInstallIfEnabled(true, resolved.packageManager, projectDir);
          return "Dependencies installed";
        },
        title: "Install dependencies",
      },
      {
        enabled: resolved.useShadcn,
        task: async (message) => {
          message?.("shadcn init…");
          await runShadcnIfEnabled({
            enabled: true,
            packageManager: resolved.packageManager,
            preset: resolved.shadcnPreset,
            projectDir,
            template: resolved.template,
          });
          return "shadcn init complete";
        },
        title: "shadcn init",
      },
      {
        enabled: resolved.runUltracite,
        task: async (message) => {
          message?.("ultracite init…");
          await runUltraciteIfEnabled(true, resolved.packageManager, projectDir);
          return "ultracite init complete";
        },
        title: "ultracite init",
      },
      {
        enabled: resolved.doGit,
        task: async (message) => {
          message?.("git init…");
          await runGitIfEnabled(true, projectDir);
          return "Git ready";
        },
        title: "git init",
      },
    ]);
  } catch (error) {
    if (error instanceof ProcessFailedError) {
      process.stderr.write(`${pc.red("Error:")} ${error.message}\n`);
    }
    if (error instanceof UserCancelledError) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    throw error;
  }
  printHumanNextSteps(resolved.name, nextSteps);
};
