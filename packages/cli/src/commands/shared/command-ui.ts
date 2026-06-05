import * as p from "@clack/prompts";
import pc from "picocolors";
import { CLIError } from "../../errors";
import { renderVernoTitle } from "../../ui";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import type { UltraciteLinterId } from "../../ultracite-linter";
import type { CommandStepPlan } from "./plan-steps";

export const requireUltraciteLinter = (
  linter: UltraciteLinterId | undefined,
  command: string,
): UltraciteLinterId => {
  if (linter === undefined) {
    throw new CLIError(
      `Ultracite init requires a linter. Pass --linter with the ultracite add-on or use interactive ${command}.`,
      { code: "ULTRACITE" },
    );
  }
  return linter;
};

export const requireUltraciteFrameworks = (
  frameworks: readonly UltraciteFrameworkId[] | undefined,
  command: string,
): readonly UltraciteFrameworkId[] => {
  if (frameworks === undefined || frameworks.length === 0) {
    throw new CLIError(
      `Ultracite init requires at least one framework. Pass --frameworks with the ultracite add-on or use interactive ${command}.`,
      { code: "ULTRACITE" },
    );
  }
  return frameworks;
};

export const printStepPlanDryRun = (args: {
  readonly title: string;
  readonly metaLines: readonly string[];
  readonly steps: readonly CommandStepPlan[];
  readonly nextSteps: readonly string[];
  readonly footer: string;
}): void => {
  renderVernoTitle(false);
  process.stdout.write(`\n${pc.magenta(args.title)}\n\n`);
  for (const line of args.metaLines) {
    process.stdout.write(`${line}\n`);
  }
  process.stdout.write("\n");

  for (const step of args.steps) {
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
  process.stdout.write(`\n${args.footer}\n`);
};

export const printDoneNextSteps = (outro: string, nextSteps: readonly string[]): void => {
  process.stdout.write(`\nDone. Next:\n`);
  for (const line of nextSteps) {
    process.stdout.write(`  ${line}\n`);
  }
  process.stdout.write(`\n`);
  p.outro(outro);
};
