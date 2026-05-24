import * as p from "@clack/prompts";
import pc from "picocolors";
import { runFullAudit } from "./audit";
import { applyFixes } from "./fix";
import { resolveDoctorInputs } from "./args";
import type { DoctorCommandOptions } from "./args";

const getSymbol = (severity: "ok" | "warning" | "error"): string => {
  if (severity === "error") {
    return pc.red("✗");
  }
  if (severity === "warning") {
    return pc.yellow("⚠");
  }
  return pc.green("✔");
};

export const runDoctor = async (args: {
  readonly options: DoctorCommandOptions;
}): Promise<void> => {
  const { options } = args;
  const projectDir = process.cwd();
  const resolved = resolveDoctorInputs(options);

  p.intro(pc.cyan("Verno Studio Doctor — Project Audit"));

  // 1. Run audit checks
  const diagnostics = runFullAudit(projectDir);

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");

  // Group by audit type for better visualization
  const categories: Record<string, string> = {
    lockfile: "Package Manager & Lockfiles",
    manifest: "Verno Manifest",
    shadcn: "shadcn/ui Configuration",
    turborepo: "Turborepo & Workspaces",
    ultracite: "Ultracite Linter & Formatter",
  };

  // Render diagnostics grouped by category
  for (const [catId, catName] of Object.entries(categories)) {
    const catDiags = diagnostics.filter((d) => d.type === catId);
    if (catDiags.length === 0) {
      continue;
    }

    process.stdout.write(`\n${pc.bold(catName)}\n`);
    for (const diag of catDiags) {
      const symbol = getSymbol(diag.severity);
      const fixIndicator = diag.fixable && diag.severity !== "ok" ? pc.cyan(" [autofixable]") : "";
      process.stdout.write(`  ${symbol} ${diag.message}${fixIndicator}\n`);
    }
  }

  process.stdout.write("\n");

  const totalIssues = errors.length + warnings.length;

  if (totalIssues === 0) {
    p.outro(pc.green("All checks passed! Your Verno project is healthy."));
    process.exitCode = 0;
    return;
  }

  const fixableDiagnostics = diagnostics.filter((d) => d.fixable && d.severity !== "ok");

  if (fixableDiagnostics.length > 0) {
    let shouldFix = resolved.fix;

    // In interactive mode, ask the user if they want to apply fixes
    if (!resolved.fix && !resolved.yes) {
      const confirmFix = await p.confirm({
        message: `Found ${String(fixableDiagnostics.length)} autofixable issues. Would you like Verno to fix them now?`,
      });

      if (p.isCancel(confirmFix)) {
        p.cancel("Doctor audit aborted.");
        process.exit(0);
      }

      shouldFix = confirmFix;
    }

    if (shouldFix) {
      const spinner = p.spinner();
      spinner.start("Applying fixes...");

      const fixResults = await applyFixes(projectDir, diagnostics, {
        packageManager: resolved.packageManager,
      });

      spinner.stop("Fixes applied");

      process.stdout.write(pc.bold("\nFix Results:\n"));
      let anyFailed = false;
      for (const result of fixResults) {
        if (result.success) {
          process.stdout.write(`  ${pc.green("✔")} ${result.message}\n`);
        } else {
          process.stdout.write(`  ${pc.red("✗")} ${result.message}\n`);
          anyFailed = true;
        }
      }
      process.stdout.write("\n");

      if (anyFailed) {
        p.outro(pc.yellow("Some fixes failed. Please check the logs above."));
        process.exitCode = 1;
        return;
      }

      // Re-run audit to verify health
      const postDiagnostics = runFullAudit(projectDir);
      const remainingIssues = postDiagnostics.filter((d) => d.severity !== "ok").length;

      if (remainingIssues === 0) {
        p.outro(pc.green("All issues successfully fixed! Your Verno project is now healthy."));
        process.exitCode = 0;
      } else {
        p.outro(
          pc.yellow(
            `Issues partially resolved. ${String(remainingIssues)} issue(s) still require manual resolution.`,
          ),
        );
        process.exitCode = 1;
      }
      return;
    }
  }

  // If we got here, issues remain and were not fixed
  p.outro(
    pc.red(
      `Audit complete. Found ${String(errors.length)} error(s) and ${String(warnings.length)} warning(s).`,
    ),
  );
  process.exitCode = 1;
};
