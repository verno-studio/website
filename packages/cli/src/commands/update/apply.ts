import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PackageManager } from "@vernostudio/template-generator";
import { readCliPackageVersion } from "../../cli-version";
import { detectVernoManifest, writeVernoManifest } from "../shared/manifest";
import { detectProjectState } from "../init/detect";
import { ensureAppGlobalsBaseLayerAtEnd } from "../../app-globals";
import { getUltraciteInitCommand } from "../../pm-exec";
import { runProcess } from "../../run";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import { EXPECTED_ULTRACITE_VERSION } from "./detect";
import type { UpdateCheck } from "./detect";

export interface UpdateResult {
  readonly id: string;
  readonly success: boolean;
  readonly message: string;
}

export const updateUltraciteDep = (projectDir: string): UpdateResult => {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) {
    return {
      id: "ultracite-dep",
      message: "package.json is missing.",
      success: false,
    };
  }

  try {
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    let updated = false;
    if (pkg.devDependencies !== undefined && "ultracite" in pkg.devDependencies) {
      pkg.devDependencies.ultracite = EXPECTED_ULTRACITE_VERSION;
      updated = true;
    } else if (pkg.dependencies !== undefined && "ultracite" in pkg.dependencies) {
      pkg.dependencies.ultracite = EXPECTED_ULTRACITE_VERSION;
      updated = true;
    }

    if (updated) {
      writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
      return {
        id: "ultracite-dep",
        message: `Successfully updated ultracite dependency to ${EXPECTED_ULTRACITE_VERSION} in package.json.`,
        success: true,
      };
    }

    return {
      id: "ultracite-dep",
      message: "ultracite dependency was not found in package.json.",
      success: false,
    };
  } catch (error) {
    return {
      id: "ultracite-dep",
      message: `Failed to update package.json: ${String(error)}`,
      success: false,
    };
  }
};

export interface ApplyUpdatesOptions {
  readonly packageManager: PackageManager;
  readonly ultraciteFrameworks?: readonly UltraciteFrameworkId[];
  /** Injectable for tests; defaults to spawning `ultracite init` via the package manager. */
  readonly runUltraciteInit?: (projectDir: string) => Promise<void>;
}

const CONFIG_FILES: Record<string, string> = {
  "oxfmt-config": "oxfmt.config.ts",
  "oxlint-config": "oxlint.config.ts",
};

const runUltraciteInitProcess = async (
  projectDir: string,
  options: ApplyUpdatesOptions,
): Promise<void> => {
  const cmd = getUltraciteInitCommand(options.packageManager, "quiet", {
    frameworks: options.ultraciteFrameworks,
    linter: "oxlint",
  });
  await runProcess(cmd.file, cmd.args, { cwd: projectDir, stepId: "ultracite" });
};

/**
 * Regenerates missing or legacy-import Ultracite config files by delegating to
 * `ultracite init`, so the emitted shape always matches the Ultracite version
 * being installed instead of a copy embedded in this CLI.
 */
export const regenerateUltraciteConfigs = async (
  projectDir: string,
  pendingIds: readonly string[],
  options: ApplyUpdatesOptions,
): Promise<UpdateResult[]> => {
  try {
    for (const id of pendingIds) {
      const path = join(projectDir, CONFIG_FILES[id]);
      // Only missing or broken legacy-import files reach here (customized ones
      // are skipped upstream); clear them so ultracite init writes fresh ones.
      if (existsSync(path)) {
        rmSync(path);
      }
    }
    await (options.runUltraciteInit
      ? options.runUltraciteInit(projectDir)
      : runUltraciteInitProcess(projectDir, options));
    return pendingIds.map((id) => {
      const exists = existsSync(join(projectDir, CONFIG_FILES[id]));
      return {
        id,
        message: exists
          ? `Successfully regenerated ${CONFIG_FILES[id]} via ultracite init.`
          : `ultracite init did not produce ${CONFIG_FILES[id]}.`,
        success: exists,
      };
    });
  } catch (error) {
    return pendingIds.map((id) => ({
      id,
      message: `Failed to regenerate ${CONFIG_FILES[id]} via ultracite init: ${String(error)}`,
      success: false,
    }));
  }
};

export const updateGlobalsCssBaseLayer = async (
  projectDir: string,
  isMonorepo: boolean,
): Promise<UpdateResult> => {
  try {
    await ensureAppGlobalsBaseLayerAtEnd(projectDir, isMonorepo);
    return {
      id: "globals-css-layer",
      message: "Successfully applied Verno base layer in globals.css.",
      success: true,
    };
  } catch (error) {
    return {
      id: "globals-css-layer",
      message: `Failed to update globals.css: ${String(error)}`,
      success: false,
    };
  }
};

export const updateManifestVersion = async (projectDir: string): Promise<UpdateResult> => {
  try {
    const manifest = detectVernoManifest(projectDir);
    if (manifest !== null) {
      const nextManifest = {
        ...manifest,
        generatorVersion: readCliPackageVersion(),
      };
      await writeVernoManifest(projectDir, nextManifest);
      return {
        id: "manifest-version",
        message: `Successfully updated manifest generatorVersion to ${nextManifest.generatorVersion}.`,
        success: true,
      };
    }
    return {
      id: "manifest-version",
      message: "Manifest file does not exist; skipping version update.",
      success: false,
    };
  } catch (error) {
    return {
      id: "manifest-version",
      message: `Failed to update manifest: ${String(error)}`,
      success: false,
    };
  }
};

export const applyUpdates = async (
  projectDir: string,
  checks: readonly UpdateCheck[],
  options: ApplyUpdatesOptions,
): Promise<UpdateResult[]> => {
  const results: UpdateResult[] = [];
  const state = detectProjectState(projectDir);

  const pendingUpdates = checks.filter((c) => c.needsUpdate);
  const pendingConfigIds = pendingUpdates
    .filter((c) => c.skipReason === undefined && c.id in CONFIG_FILES)
    .map((c) => c.id);
  let configsRegenerated = false;

  for (const check of pendingUpdates) {
    if (check.skipReason !== undefined) {
      continue;
    }

    if (check.id === "ultracite-dep") {
      results.push(updateUltraciteDep(projectDir));
    } else if (check.id in CONFIG_FILES) {
      // Both config files come from one `ultracite init` run; handle them together.
      if (!configsRegenerated) {
        configsRegenerated = true;
        results.push(...(await regenerateUltraciteConfigs(projectDir, pendingConfigIds, options)));
      }
    } else if (check.id === "globals-css-layer") {
      results.push(await updateGlobalsCssBaseLayer(projectDir, state.isMonorepo));
    } else if (check.id === "manifest-version") {
      results.push(await updateManifestVersion(projectDir));
    }
  }

  return results;
};
