import * as p from "@clack/prompts";
import pc from "picocolors";
import { runFullAudit } from "../doctor/audit";
import { resolveUpdateInputs } from "./args";
import type { UpdateCommandOptions } from "./args";
import { trackEvent } from "../../analytics";
import { runUpdateChecks } from "./detect";
import type { UpdateCheck } from "./detect";
import { applyUpdates } from "./apply";
import type { UpdateResult } from "./apply";

const printUpdatePreview = (
  coreUpdates: readonly UpdateCheck[],
  npmUpdate: UpdateCheck | undefined,
): void => {
  process.stdout.write(pc.bold("\nUpdate Preview:\n"));
  const categories: Record<string, string> = {
    config: "Configuration",
    css: "Styles",
    deps: "Dependencies",
    version: "Version",
  };

  for (const [catId, catName] of Object.entries(categories)) {
    const catUpdates = coreUpdates.filter((c) => c.category === catId);
    if (catUpdates.length === 0) {
      continue;
    }

    process.stdout.write(`  ${pc.bold(catName)}\n`);
    for (const update of catUpdates) {
      const skipMarker = update.skipReason === undefined ? "" : pc.yellow(" (skipped)");
      process.stdout.write(
        `    ${pc.cyan("⬆")} ${update.description}: ${pc.yellow(update.current)} → ${pc.green(update.expected)}${skipMarker}\n`,
      );
      if (update.skipReason !== undefined) {
        process.stdout.write(`      ${pc.dim(update.skipReason)}\n`);
      }
    }
  }
  process.stdout.write("\n");

  if (npmUpdate !== undefined && npmUpdate.details !== undefined) {
    p.log.info(pc.yellow(npmUpdate.details));
    process.stdout.write("\n");
  }
};

const printUpdateResults = (results: readonly UpdateResult[]): boolean => {
  process.stdout.write(pc.bold("\nUpdate Results:\n"));
  let anyFailed = false;
  for (const result of results) {
    if (result.success) {
      process.stdout.write(`  ${pc.green("✔")} ${result.message}\n`);
    } else {
      process.stdout.write(`  ${pc.red("✗")} ${result.message}\n`);
      anyFailed = true;
    }
  }
  process.stdout.write("\n");
  return anyFailed;
};

export const runUpdate = async (args: {
  readonly options: UpdateCommandOptions;
}): Promise<void> => {
  const { options } = args;
  const projectDir = process.cwd();
  const resolved = resolveUpdateInputs(options);

  p.intro(pc.cyan("Verno Studio Update — Project Update"));

  const preDiagnostics = runFullAudit(projectDir);
  const criticalErrors = preDiagnostics.filter((d) => d.severity === "error");

  if (criticalErrors.length > 0) {
    p.log.error(pc.red("Cannot run update. The project has critical configuration errors:"));
    for (const err of criticalErrors) {
      p.log.error(`  ${pc.red("✗")} ${err.message}`);
    }
    p.log.info(pc.yellow("Please run `verno doctor --fix` to resolve these issues first."));
    p.outro(pc.red("Update aborted."));
    process.exitCode = 1;
    return;
  }

  const checks = await runUpdateChecks(projectDir);
  const pendingUpdates = checks.filter((c) => c.needsUpdate);

  const npmUpdate = checks.find((c) => c.id === "cli-npm-version" && c.needsUpdate);
  const coreUpdates = pendingUpdates.filter((c) => c.id !== "cli-npm-version");

  if (coreUpdates.length === 0) {
    p.log.step(pc.green("✔ Your project's Verno configuration is already up to date."));
    if (npmUpdate !== undefined && npmUpdate.details !== undefined) {
      p.log.info(pc.yellow(npmUpdate.details));
    }
    p.outro(pc.green("All checks passed!"));
    process.exitCode = 0;
    return;
  }

  printUpdatePreview(coreUpdates, npmUpdate);

  if (resolved.dryRun) {
    p.outro(pc.yellow("Dry run: no changes were made."));
    process.exitCode = 0;
    return;
  }

  const actualUpdatesToApply = coreUpdates.filter((c) => c.skipReason === undefined);
  if (actualUpdatesToApply.length === 0) {
    p.log.info(pc.yellow("All updates were skipped. No actions to perform."));
    p.outro(pc.green("Done!"));
    process.exitCode = 0;
    return;
  }

  let shouldUpdate = resolved.yes;
  if (!resolved.yes) {
    const confirmUpdate = await p.confirm({
      message: `Apply ${String(actualUpdatesToApply.length)} updates now?`,
    });

    if (p.isCancel(confirmUpdate)) {
      p.cancel("Update cancelled.");
      process.exit(0);
    }

    shouldUpdate = confirmUpdate;
  }

  if (!shouldUpdate) {
    p.outro(pc.yellow("Update aborted."));
    process.exitCode = 0;
    return;
  }

  const spinner = p.spinner();
  spinner.start("Applying updates...");
  const results = await applyUpdates(projectDir, checks);
  spinner.stop("Updates applied");

  const anyFailed = printUpdateResults(results);

  if (anyFailed) {
    p.outro(pc.yellow("Some updates failed. Please check the logs above."));
    process.exitCode = 1;
    return;
  }

  const hasDepUpdate = results.some((r) => r.id === "ultracite-dep" && r.success);
  if (hasDepUpdate && resolved.install) {
    const { detectPackageManager } = await import("../init/detect");
    const { runInstallIfEnabled } = await import("../shared/post-scaffold");
    const pm = resolved.packageManager ?? detectPackageManager(projectDir) ?? "bun";

    const installSpinner = p.spinner();
    installSpinner.start("Installing dependencies...");
    try {
      await runInstallIfEnabled(true, pm, projectDir);
      installSpinner.stop("Dependencies installed");
    } catch (error) {
      installSpinner.stop("Dependency installation failed");
      p.log.error(pc.red(`Failed to install dependencies: ${String(error)}`));
      process.exitCode = 1;
      return;
    }
  }

  const postDiagnostics = runFullAudit(projectDir);
  const remainingIssues = postDiagnostics.filter((d) => d.severity !== "ok").length;

  void trackEvent("update_run", {
    dry_run: false,
    package_manager: resolved.packageManager,
    updates_applied: results.filter((r) => r.success).length,
  });

  if (remainingIssues === 0) {
    p.outro(
      pc.green("All updates successfully applied! Your project is fully up to date and healthy."),
    );
    process.exitCode = 0;
  } else {
    p.outro(
      pc.yellow(
        `Updates completed, but ${String(remainingIssues)} issue(s) still require attention. Run \`verno doctor\` to audit.`,
      ),
    );
    process.exitCode = 0;
  }
};
