import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readCliPackageVersion } from "../../cli-version";
import { detectVernoManifest, writeVernoManifest } from "../shared/manifest";
import { detectProjectState } from "../init/detect";
import { ensureAppGlobalsBaseLayerAtEnd } from "../../app-globals";
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

export const regenerateOxlintConfig = (projectDir: string): UpdateResult => {
  const path = join(projectDir, "oxlint.config.ts");
  try {
    writeFileSync(
      path,
      `import ultracite from "ultracite/presets/oxlint";\n\nexport default ultracite();\n`,
      "utf-8",
    );
    return {
      id: "oxlint-config",
      message: "Successfully generated oxlint.config.ts.",
      success: true,
    };
  } catch (error) {
    return {
      id: "oxlint-config",
      message: `Failed to generate oxlint.config.ts: ${String(error)}`,
      success: false,
    };
  }
};

export const regenerateOxfmtConfig = (projectDir: string): UpdateResult => {
  const path = join(projectDir, "oxfmt.config.ts");
  try {
    writeFileSync(
      path,
      `import ultracite from "ultracite/presets/oxfmt";\n\nexport default ultracite();\n`,
      "utf-8",
    );
    return {
      id: "oxfmt-config",
      message: "Successfully generated oxfmt.config.ts.",
      success: true,
    };
  } catch (error) {
    return {
      id: "oxfmt-config",
      message: `Failed to generate oxfmt.config.ts: ${String(error)}`,
      success: false,
    };
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
): Promise<UpdateResult[]> => {
  const results: UpdateResult[] = [];
  const state = detectProjectState(projectDir);

  const pendingUpdates = checks.filter((c) => c.needsUpdate);

  for (const check of pendingUpdates) {
    if (check.skipReason !== undefined) {
      continue;
    }

    if (check.id === "ultracite-dep") {
      results.push(updateUltraciteDep(projectDir));
    } else if (check.id === "oxlint-config") {
      results.push(regenerateOxlintConfig(projectDir));
    } else if (check.id === "oxfmt-config") {
      results.push(regenerateOxfmtConfig(projectDir));
    } else if (check.id === "globals-css-layer") {
      results.push(await updateGlobalsCssBaseLayer(projectDir, state.isMonorepo));
    } else if (check.id === "manifest-version") {
      results.push(await updateManifestVersion(projectDir));
    }
  }

  return results;
};
