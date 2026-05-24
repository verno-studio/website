import * as p from "@clack/prompts";
import pc from "picocolors";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../../errors";
import { runInteractiveInitWizard } from "./prompts";
import { resolveInitInputsNonInteractive } from "./args";
import type { InitCommandOptions, ResolvedInitInputs } from "./args";
import { buildInitPlan, getInitPlanSummary } from "./plan";
import {
  detectProjectState,
  restructureForTurborepo,
  buildVernoManifest,
  writeVernoManifest,
} from "./actions";
import type { DetectedState } from "./actions";
import { getNextStepHints } from "./next-steps";
import { printDoneNextSteps, printStepPlanDryRun } from "../shared/command-ui";
import { runInstallTask, runPostSetupPipeline } from "../shared/post-setup-pipeline";
import { trackEvent } from "../../analytics";

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
    resolved = { ...resolved, packageManager: detected.packageManager };
  }

  const monorepo = detected.isMonorepo || resolved.addons.includes("turborepo");
  const needsRestructure = resolved.addons.includes("turborepo") && !detected.isMonorepo;
  const detectedForPlan = {
    hasShadcn: detected.hasShadcn,
    hasUltracite: detected.hasUltracite,
    isMonorepo: detected.isMonorepo,
    packageManager: detected.packageManager,
  };

  const { steps } = buildInitPlan(resolved, detectedForPlan, projectDir);
  const plan = getInitPlanSummary(resolved, detectedForPlan, projectDir, steps);
  const nextSteps = getNextStepHints(resolved, detected);

  if (options.dryRun) {
    printStepPlanDryRun({
      footer: "Run without --dry-run to apply changes.",
      metaLines: [
        `Project: ${detected.projectName}`,
        `Monorepo: ${detected.isMonorepo ? "yes" : "no"}`,
        `Stack: add-ons: ${plan.addons.join(", ") || "none"}`,
      ],
      nextSteps,
      steps,
      title: "init — plan (dry run)",
    });
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

    await runInstallTask({
      doInstall: resolved.doInstall,
      packageManager: resolved.packageManager,
      projectDir,
    });

    await runPostSetupPipeline({
      commandName: "init",
      monorepo,
      packageManager: resolved.packageManager,
      projectDir,
      shadcn: {
        enabled: resolved.useShadcn && !detected.hasShadcn,
        monorepoWithDesignSystem: monorepo && resolved.addons.includes("turborepo"),
        preset: resolved.shadcnPreset,
      },
      ultracite: {
        enabled: resolved.runUltracite && !detected.hasUltracite,
        linter: resolved.ultraciteLinter,
        nonInteractive: resolved.nonInteractive,
      },
      writeManifest: () =>
        writeVernoManifest(
          projectDir,
          buildVernoManifest({
            existing: detected.manifest,
            projectName: detected.projectName,
            resolved,
          }),
        ),
    });
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

  void trackEvent("init_project", {
    addons: resolved.addons,
    dry_run: false,
    linter: resolved.ultraciteLinter,
    package_manager: resolved.packageManager,
    shadcn_preset: resolved.shadcnPreset,
    ui: resolved.ui,
  });

  printDoneNextSteps(`Project "${detected.projectName}" is initialized.`, nextSteps);
};
