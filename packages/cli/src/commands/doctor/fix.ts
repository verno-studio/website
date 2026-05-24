import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PackageManager } from "@vernostudio/template-generator";
import { detectProjectState, detectPackageManager } from "../init/detect";
import { buildVernoManifestForInit, writeVernoManifest } from "../shared/manifest";
import type { Diagnostic } from "./audit";

export interface FixResult {
  readonly id: string;
  readonly success: boolean;
  readonly message: string;
}

export const fixLockfiles = (projectDir: string, activePm?: PackageManager): FixResult => {
  const detectedPm = activePm ?? detectPackageManager(projectDir) ?? "bun";

  const allLockfiles = [
    { file: "bun.lockb", pm: "bun" },
    { file: "bun.lock", pm: "bun" },
    { file: "pnpm-lock.yaml", pm: "pnpm" },
    { file: "package-lock.json", pm: "npm" },
  ];

  let removedCount = 0;
  const removedNames: string[] = [];

  for (const lf of allLockfiles) {
    if (lf.pm !== detectedPm) {
      const path = join(projectDir, lf.file);
      if (existsSync(path)) {
        try {
          unlinkSync(path);
          removedCount += 1;
          removedNames.push(lf.file);
        } catch (error) {
          return {
            id: "lockfile-conflicts",
            message: `Failed to remove conflicting lockfile ${lf.file}: ${String(error)}`,
            success: false,
          };
        }
      }
    }
  }

  if (removedCount > 0) {
    return {
      id: "lockfile-conflicts",
      message: `Successfully removed conflicting lockfiles: ${removedNames.join(", ")}.`,
      success: true,
    };
  }

  return {
    id: "lockfile-conflicts",
    message: "No conflicting lockfiles needed to be removed.",
    success: true,
  };
};

export const fixManifest = async (
  projectDir: string,
  options: { readonly packageManager?: PackageManager },
): Promise<FixResult> => {
  try {
    const state = detectProjectState(projectDir);

    const pm = options.packageManager ?? state.packageManager ?? "bun";
    const addons: ("turborepo" | "ultracite")[] = [];
    if (state.isMonorepo) {
      addons.push("turborepo");
    }
    if (state.hasUltracite) {
      addons.push("ultracite");
    }

    const packages: ("typescript-config" | "design-system")[] = [];
    if (state.isMonorepo) {
      if (existsSync(join(projectDir, "packages", "typescript-config"))) {
        packages.push("typescript-config");
      }
      if (existsSync(join(projectDir, "packages", "design-system"))) {
        packages.push("design-system");
      }
    }

    // Attempt to determine linter
    let linter: "oxlint" | "biome" | "eslint" | undefined;
    if (state.hasUltracite) {
      if (
        existsSync(join(projectDir, "oxlint.config.ts")) ||
        existsSync(join(projectDir, "oxlint.config.js"))
      ) {
        linter = "oxlint";
      } else if (
        existsSync(join(projectDir, "biome.json")) ||
        existsSync(join(projectDir, "biome.jsonc"))
      ) {
        linter = "biome";
      } else if (
        existsSync(join(projectDir, "eslint.config.js")) ||
        existsSync(join(projectDir, "eslint.config.mjs"))
      ) {
        linter = "eslint";
      }
    }

    const resolved = {
      addons,
      doInstall: false,
      nonInteractive: true,
      packageManager: pm,
      runUltracite: state.hasUltracite,
      shadcnPreset: "nova",
      ui: (state.hasShadcn ? "shadcn" : "none") as "shadcn" | "none",
      ultraciteLinter: linter ?? "oxlint",
      useShadcn: state.hasShadcn,
    };

    const manifest = buildVernoManifestForInit({
      existing: null,
      projectName: state.projectName,
      resolved,
    });

    await writeVernoManifest(projectDir, manifest);

    return {
      id: "manifest-missing",
      message: "Successfully reconstructed .verno/manifest.json based on project state.",
      success: true,
    };
  } catch (error) {
    return {
      id: "manifest-missing",
      message: `Failed to reconstruct .verno/manifest.json: ${String(error)}`,
      success: false,
    };
  }
};

export const fixUltraciteConfigs = (projectDir: string): FixResult => {
  try {
    // Generate default configuration files directly to avoid execution stalls
    const oxlintConfigPath = join(projectDir, "oxlint.config.ts");
    const oxfmtConfigPath = join(projectDir, "oxfmt.config.ts");

    writeFileSync(
      oxlintConfigPath,
      `import ultracite from "ultracite/presets/oxlint";\n\nexport default ultracite();\n`,
      "utf-8",
    );
    writeFileSync(
      oxfmtConfigPath,
      `import ultracite from "ultracite/presets/oxfmt";\n\nexport default ultracite();\n`,
      "utf-8",
    );

    return {
      id: "ultracite-configs-missing",
      message:
        "Successfully generated default oxlint.config.ts and oxfmt.config.ts configurations.",
      success: true,
    };
  } catch (error) {
    return {
      id: "ultracite-configs-missing",
      message: `Failed to create Ultracite configs: ${String(error)}`,
      success: false,
    };
  }
};

export const applyFixes = async (
  projectDir: string,
  diagnostics: readonly Diagnostic[],
  options: { readonly packageManager?: PackageManager },
): Promise<FixResult[]> => {
  const results: FixResult[] = [];

  const fixableIds = new Set(
    diagnostics.filter((d) => d.fixable && d.severity !== "ok").map((d) => d.id),
  );

  if (fixableIds.has("lockfile-conflicts") || fixableIds.has("package-manager-mismatch")) {
    results.push(fixLockfiles(projectDir, options.packageManager));
  }

  if (fixableIds.has("manifest-missing") || fixableIds.has("manifest-invalid")) {
    results.push(await fixManifest(projectDir, options));
  }

  if (fixableIds.has("ultracite-configs-missing")) {
    results.push(fixUltraciteConfigs(projectDir));
  }

  return results;
};
