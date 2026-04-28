import * as p from "@clack/prompts";
import { defaultNpmScopeFromProjectName } from "@vernostudio/template-generator";
import pc from "picocolors";
import { dimPath, renderVernoTitle } from "../ui";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../errors";
import { runInteractiveCreateWizard } from "./create-prompts";
import {
  resolveCreateInputsNonInteractive,
  resolvedHasDesignSystem,
  resolvedUsesTurborepo,
} from "./create-args";
import type { CreateCommandOptions, ResolvedCreateInputs } from "./create-args";
import type { UltraciteLinterId } from "../ultracite-linter";
import {
  assertPathAvailable,
  buildVernoManifest,
  ensureAppGlobalsBaseLayerAtEnd,
  getProjectPath,
  runGitInitAndCommitIfEnabled,
  runInstallIfEnabled,
  runShadcnIfEnabled,
  runUltraciteIfEnabled,
  scaffold,
  toProjectConfig,
  writeVernoManifest,
} from "./create-actions";
import { getNextStepHints } from "./create-next-steps";
import { buildCreatePlan, getPlanSummary } from "./create-plan";
import type { CreatePlanSummary } from "./create-plan";

const requireUltraciteLinter = (resolved: ResolvedCreateInputs): UltraciteLinterId => {
  const l = resolved.ultraciteLinter;
  if (l === undefined) {
    throw new CLIError(
      "Ultracite init requires resolved.ultraciteLinter. Pass --linter with the ultracite add-on or use interactive create.",
      { code: "ULTRACITE" },
    );
  }
  return l;
};

const printHumanDryRun = (args: {
  projectDir: string;
  projectName: string;
  nextSteps: readonly string[];
  plan: CreatePlanSummary;
}): void => {
  renderVernoTitle(false);
  process.stdout.write(`\n${pc.magenta("create — plan (dry run)")}\n\n`);
  process.stdout.write(`Project: ${args.projectName}\n`);
  process.stdout.write(`Path:    ${dimPath(args.projectDir, false)}\n`);
  process.stdout.write(
    `Stack:   ${args.plan.frontend} | add-ons: ${args.plan.addons.join(", ") || "none"} | packages: ${args.plan.packages.join(", ") || "—"}\n\n`,
  );
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

  const config = toProjectConfig({
    name: resolved.name,
    npmScope: defaultNpmScopeFromProjectName(resolved.name),
    packageManager: resolved.packageManager,
    resolved,
    shadcnPreset: resolved.shadcnPreset,
  });

  try {
    assertPathAvailable(projectDir);
    const monorepo = resolvedUsesTurborepo(resolved);
    const normalizeAppGlobalsLayer = (): Promise<void> =>
      ensureAppGlobalsBaseLayerAtEnd(projectDir, monorepo);

    await p.tasks([
      {
        task: async (message) => {
          const { filesWritten: n } = await scaffold(config, projectDir, (line) => {
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
    ]);

    if (resolved.useShadcn) {
      process.stdout.write(
        `\n${pc.cyan("shadcn")} — ${pc.dim(
          "init + add --all (full output below; can take several minutes)",
        )}\n\n`,
      );
      await runShadcnIfEnabled({
        enabled: true,
        monorepoWithDesignSystem: resolvedHasDesignSystem(resolved),
        packageManager: resolved.packageManager,
        preset: resolved.shadcnPreset,
        projectDir,
      });
      process.stdout.write("\n");
    }

    await normalizeAppGlobalsLayer();

    if (resolved.runUltracite) {
      const linter = requireUltraciteLinter(resolved);

      await p.tasks([
        {
          enabled: resolved.nonInteractive,
          task: async (message) => {
            message?.("ultracite init (quiet)…");
            await runUltraciteIfEnabled(true, resolved.packageManager, projectDir, "quiet", {
              linter,
            });
            return "ultracite init complete";
          },
          title: "ultracite init",
        },
      ]);

      if (!resolved.nonInteractive) {
        process.stdout.write(
          `\n${pc.cyan("ultracite")} — Linter: ${linter}. Continue in Ultracite for frameworks, editors, and hooks.\n\n`,
        );
        await runUltraciteIfEnabled(true, resolved.packageManager, projectDir, "interactive", {
          ciSafe: false,
          linter,
        });
      }
    }

    const manifest = buildVernoManifest({ projectName: resolved.name, resolved });
    await writeVernoManifest(projectDir, manifest);
    await normalizeAppGlobalsLayer();
    await runGitInitAndCommitIfEnabled(resolved.doGit, projectDir);
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
