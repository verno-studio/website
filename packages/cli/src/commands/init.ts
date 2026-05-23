import * as p from "@clack/prompts";
import pc from "picocolors";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../errors";
import { renderVernoTitle } from "../ui";
import { runInteractiveInitWizard } from "./init-prompts";
import { resolveInitInputsNonInteractive } from "./init-args";
import type { InitCommandOptions, ResolvedInitInputs } from "./init-args";
import { buildInitPlan, getInitPlanSummary } from "./init-plan";
import type { InitPlanSummary } from "./init-plan";
import {
  detectProjectState,
  restructureForTurborepo,
  buildVernoManifest,
  writeVernoManifest,
} from "./init-actions";
import type { DetectedState } from "./init-actions";
import {
  runInstallIfEnabled,
  runShadcnIfEnabled,
  runUltraciteIfEnabled,
  ensureAppGlobalsBaseLayerAtEnd,
} from "./create-actions";
import { getNextStepHints } from "./init-next-steps";
import type { UltraciteLinterId } from "../ultracite-linter";

const requireUltraciteLinter = (resolved: ResolvedInitInputs): UltraciteLinterId => {
  const l = resolved.ultraciteLinter;
  if (l === undefined) {
    throw new CLIError(
      "Ultracite init requires resolved.ultraciteLinter. Pass --linter with the ultracite add-on or use interactive init.",
      { code: "ULTRACITE" },
    );
  }
  return l;
};

const printHumanDryRun = (args: {
  detected: DetectedState;
  plan: InitPlanSummary;
  nextSteps: readonly string[];
}): void => {
  renderVernoTitle(false);
  process.stdout.write(`\n${pc.magenta("init — plan (dry run)")}\n\n`);
  process.stdout.write(`Project: ${args.detected.projectName}\n`);
  process.stdout.write(`Monorepo: ${args.detected.isMonorepo ? "yes" : "no"}\n`);
  process.stdout.write(`Stack: add-ons: ${args.plan.addons.join(", ") || "none"}\n\n`);
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
  process.stdout.write(`\nRun without --dry-run to apply changes.\n`);
};

const printHumanNextSteps = (detected: DetectedState, nextSteps: readonly string[]): void => {
  process.stdout.write(`\nDone. Next:\n`);
  for (const line of nextSteps) {
    process.stdout.write(`  ${line}\n`);
  }
  process.stdout.write(`\n`);
  p.outro(`Project "${detected.projectName}" is initialized.`);
};

const resolveInputs = async (args: {
  options: InitCommandOptions;
  detected: DetectedState;
}): Promise<ResolvedInitInputs> => {
  const { options, detected } = args;

  if (options.yes) {
    return resolveInitInputsNonInteractive(options);
  }

  try {
    return await runInteractiveInitWizard({
      detected: {
        hasShadcn: detected.hasShadcn,
        hasUltracite: detected.hasUltracite,
        isMonorepo: detected.isMonorepo,
        packageManager: detected.packageManager,
        projectName: detected.projectName,
      },
      options,
    });
  } catch (error) {
    if (isUserCancelled(error)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    throw error;
  }
};

export const runInit = async (args: { options: InitCommandOptions }): Promise<void> => {
  const { options } = args;
  const { dryRun } = options;

  const projectDir = process.cwd();
  const detected = detectProjectState(projectDir);

  if (!detected.packageJson) {
    throw new CLIError(
      "No package.json found. This command must be run inside an existing project directory.",
      { code: "VALIDATION" },
    );
  }

  let resolved = await resolveInputs({ detected, options });

  if (!options.packageManager && detected.packageManager) {
    resolved = {
      ...resolved,
      packageManager: detected.packageManager,
    };
  }

  const monorepo = detected.isMonorepo || resolved.addons.includes("turborepo");
  const needsRestructure = resolved.addons.includes("turborepo") && !detected.isMonorepo;

  const { steps } = buildInitPlan(
    resolved,
    {
      hasShadcn: detected.hasShadcn,
      hasUltracite: detected.hasUltracite,
      isMonorepo: detected.isMonorepo,
      packageManager: detected.packageManager,
    },
    projectDir,
  );
  const plan = getInitPlanSummary(
    resolved,
    {
      hasShadcn: detected.hasShadcn,
      hasUltracite: detected.hasUltracite,
      isMonorepo: detected.isMonorepo,
    },
    projectDir,
    steps,
  );
  const nextSteps = getNextStepHints(resolved, detected);

  if (dryRun) {
    printHumanDryRun({ detected, nextSteps, plan });
    return;
  }

  if (needsRestructure && !options.yes) {
    process.stderr.write(
      `\n${pc.yellow("⚠")} Turborepo init will restructure your project:\n` +
        `   - Move src/, public/, app/, config files into apps/web/\n` +
        `   - Create packages/ directory\n` +
        `   - Update package.json with workspaces config\n` +
        `   - Create turbo.json\n` +
        `Recommend backing up your project first.\n\n`,
    );
  }

  try {
    if (needsRestructure) {
      await restructureForTurborepo(projectDir, resolved.packageManager);
    }

    const normalizeAppGlobalsLayer = (): Promise<void> =>
      ensureAppGlobalsBaseLayerAtEnd(projectDir, monorepo);

    await p.tasks([
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

    if (resolved.useShadcn && !detected.hasShadcn) {
      const monorepoWithDesignSystem = monorepo && resolved.addons.includes("turborepo");

      process.stdout.write(
        `\n${pc.cyan("shadcn")} — ${pc.dim("bootstrap (init/apply) + add --all")}\n\n`,
      );

      await runShadcnIfEnabled({
        enabled: true,
        monorepoWithDesignSystem,
        packageManager: resolved.packageManager,
        preset: resolved.shadcnPreset,
        projectDir,
      });
      process.stdout.write("\n");
    }

    await normalizeAppGlobalsLayer();

    if (resolved.runUltracite && !detected.hasUltracite) {
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

    const manifest = buildVernoManifest({
      existing: detected.manifest,
      projectName: detected.projectName,
      resolved,
    });
    await writeVernoManifest(projectDir, manifest);
    await normalizeAppGlobalsLayer();
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

  printHumanNextSteps(detected, nextSteps);
};
