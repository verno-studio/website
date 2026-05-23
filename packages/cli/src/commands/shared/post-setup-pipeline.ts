import * as p from "@clack/prompts";
import pc from "picocolors";
import type { PackageManager } from "@vernostudio/template-generator";
import { ensureAppGlobalsBaseLayerAtEnd } from "../../app-globals";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { requireUltraciteLinter } from "./command-ui";
import { runInstallIfEnabled, runShadcnIfEnabled, runUltraciteIfEnabled } from "./post-scaffold";

const SHADCN_BANNER_BASE = "bootstrap (init/apply) + add --all";

export interface PostSetupPipelineContext {
  readonly projectDir: string;
  readonly packageManager: PackageManager;
  readonly monorepo: boolean;
  readonly shadcn: {
    readonly enabled: boolean;
    readonly monorepoWithDesignSystem: boolean;
    readonly preset: string;
    readonly bannerSuffix?: string;
  };
  readonly ultracite: {
    readonly enabled: boolean;
    readonly nonInteractive: boolean;
    readonly linter?: UltraciteLinterId;
  };
  readonly commandName: "create" | "init";
  readonly writeManifest: () => Promise<void>;
  readonly afterComplete?: () => Promise<void>;
}

export const runInstallTask = async (args: {
  readonly doInstall: boolean;
  readonly packageManager: PackageManager;
  readonly projectDir: string;
}): Promise<void> => {
  await p.tasks([
    {
      enabled: args.doInstall,
      task: async (message) => {
        message?.("Installing dependencies…");
        await runInstallIfEnabled(true, args.packageManager, args.projectDir);
        return "Dependencies installed";
      },
      title: "Install dependencies",
    },
  ]);
};

export const runPostSetupPipeline = async (ctx: PostSetupPipelineContext): Promise<void> => {
  if (ctx.shadcn.enabled) {
    const banner = ctx.shadcn.bannerSuffix
      ? `${SHADCN_BANNER_BASE} ${ctx.shadcn.bannerSuffix}`
      : SHADCN_BANNER_BASE;
    process.stdout.write(`\n${pc.cyan("shadcn")} — ${pc.dim(banner)}\n\n`);
    await runShadcnIfEnabled({
      enabled: true,
      monorepoWithDesignSystem: ctx.shadcn.monorepoWithDesignSystem,
      packageManager: ctx.packageManager,
      preset: ctx.shadcn.preset,
      projectDir: ctx.projectDir,
    });
    process.stdout.write("\n");
  }

  if (ctx.ultracite.enabled) {
    const linter = requireUltraciteLinter(ctx.ultracite.linter, ctx.commandName);

    await p.tasks([
      {
        enabled: ctx.ultracite.nonInteractive,
        task: async (message) => {
          message?.("ultracite init (quiet)…");
          await runUltraciteIfEnabled(true, ctx.packageManager, ctx.projectDir, "quiet", {
            linter,
          });
          return "ultracite init complete";
        },
        title: "ultracite init",
      },
    ]);

    if (!ctx.ultracite.nonInteractive) {
      process.stdout.write(
        `\n${pc.cyan("ultracite")} — Linter: ${linter}. Continue in Ultracite for frameworks, editors, and hooks.\n\n`,
      );
      await runUltraciteIfEnabled(true, ctx.packageManager, ctx.projectDir, "interactive", {
        ciSafe: false,
        linter,
      });
    }
  }

  await ctx.writeManifest();
  await ensureAppGlobalsBaseLayerAtEnd(ctx.projectDir, ctx.monorepo);
  await ctx.afterComplete?.();
};
