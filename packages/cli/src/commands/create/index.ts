import * as p from "@clack/prompts";
import { defaultNpmScopeFromProjectName } from "@vernostudio/template-generator";
import pc from "picocolors";
import { dimPath } from "../../ui";
import { UserCancelledError, CLIError, ProcessFailedError, isUserCancelled } from "../../errors";
import { runInteractiveCreateWizard } from "./prompts";
import {
  resolveCreateInputsNonInteractive,
  resolvedHasDesignSystem,
  resolvedUsesTurborepo,
} from "./args";
import type { CreateCommandOptions, ResolvedCreateInputs } from "./args";
import {
  assertPathAvailable,
  buildVernoManifest,
  getProjectPath,
  runGitInitAndCommitIfEnabled,
  scaffold,
  toProjectConfig,
  writeVernoManifest,
} from "./actions";
import { getNextStepHints } from "./next-steps";
import { buildCreatePlan, getPlanSummary } from "./plan";
import { printDoneNextSteps, printStepPlanDryRun } from "../shared/command-ui";
import { runInstallTask, runPostSetupPipeline } from "../shared/post-setup-pipeline";
import { trackEvent } from "../../analytics";

const resolveInputs = async (args: {
  name?: string;
  options: CreateCommandOptions;
}): Promise<ResolvedCreateInputs> => {
  const { name, options } = args;

  if (options.yes) {
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
  const resolved = await resolveInputs(args);
  const projectDir = getProjectPath(resolved.name);
  const { steps } = buildCreatePlan(resolved, projectDir);
  const plan = getPlanSummary(resolved, projectDir, steps);
  const nextSteps = getNextStepHints(resolved);

  if (options.dryRun) {
    assertPathAvailable(projectDir);
    printStepPlanDryRun({
      footer: "Run without --dry-run to create the project.",
      metaLines: [
        `Project: ${resolved.name}`,
        `Path:    ${dimPath(projectDir, false)}`,
        `Stack:   ${plan.frontend} | add-ons: ${plan.addons.join(", ") || "none"} | packages: ${plan.packages.join(", ") || "—"}`,
      ],
      nextSteps,
      steps,
      title: "create — plan (dry run)",
    });
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
    ]);

    await runInstallTask({
      doInstall: resolved.doInstall,
      packageManager: resolved.packageManager,
      projectDir,
    });

    await runPostSetupPipeline({
      afterComplete: () => runGitInitAndCommitIfEnabled(resolved.doGit, projectDir),
      commandName: "create",
      monorepo,
      packageManager: resolved.packageManager,
      projectDir,
      shadcn: {
        bannerSuffix: "(full output below; can take several minutes)",
        enabled: resolved.useShadcn,
        monorepoWithDesignSystem: resolvedHasDesignSystem(resolved),
        preset: resolved.shadcnPreset,
      },
      ultracite: {
        enabled: resolved.runUltracite,
        frameworks: resolved.ultraciteFrameworks,
        linter: resolved.ultraciteLinter,
        nonInteractive: resolved.nonInteractive,
      },
      writeManifest: () =>
        writeVernoManifest(
          projectDir,
          buildVernoManifest({ projectName: resolved.name, resolved }),
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

  await trackEvent("create_project", {
    addons: resolved.addons,
    dry_run: false,
    frontend: resolved.frontend,
    linter: resolved.ultraciteLinter,
    package_manager: resolved.packageManager,
    shadcn_preset: resolved.shadcnPreset,
    skip_git: !resolved.doGit,
    skip_install: !resolved.doInstall,
    ui: resolved.ui,
    ultracite_frameworks: resolved.ultraciteFrameworks?.join(","),
  });

  printDoneNextSteps(`Project "${resolved.name}" is ready.`, nextSteps);
};
