import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { detectProjectState } from "../init/detect";
import { detectVernoManifest } from "../shared/manifest";
import type { VernoManifest } from "../shared/manifest";

export interface Diagnostic {
  readonly id: string;
  readonly type: "manifest" | "lockfile" | "turborepo" | "shadcn" | "ultracite";
  readonly severity: "ok" | "warning" | "error";
  readonly message: string;
  readonly fixable: boolean;
  readonly details?: string;
}

export const runManifestAudit = (projectDir: string): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const manifestPath = join(projectDir, ".verno", "manifest.json");

  if (!existsSync(manifestPath)) {
    diagnostics.push({
      fixable: true,
      id: "manifest-missing",
      message: "Verno manifest (.verno/manifest.json) is missing.",
      severity: "warning",
      type: "manifest",
    });
    return diagnostics;
  }

  try {
    const manifest = detectVernoManifest(projectDir);
    if (manifest === null) {
      diagnostics.push({
        fixable: true,
        id: "manifest-invalid",
        message: "Verno manifest exists but is invalid or malformed.",
        severity: "error",
        type: "manifest",
      });
    } else {
      diagnostics.push({
        fixable: false,
        id: "manifest-ok",
        message: `Verno manifest is valid (Project: ${manifest.projectName}, version: ${manifest.generatorVersion}).`,
        severity: "ok",
        type: "manifest",
      });
    }
  } catch {
    diagnostics.push({
      fixable: true,
      id: "manifest-invalid",
      message: "Verno manifest exists but failed to parse.",
      severity: "error",
      type: "manifest",
    });
  }

  return diagnostics;
};

export const runLockfileAudit = (projectDir: string): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const pkgPath = join(projectDir, "package.json");

  if (!existsSync(pkgPath)) {
    diagnostics.push({
      fixable: false,
      id: "package-json-missing",
      message: "package.json is missing from the root.",
      severity: "error",
      type: "lockfile",
    });
    return diagnostics;
  }

  const pkgRaw = readFileSync(pkgPath, "utf-8");
  let packageManagerField: string | undefined;
  try {
    const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
    packageManagerField = pkg.packageManager as string | undefined;
  } catch {
    diagnostics.push({
      fixable: false,
      id: "package-json-invalid",
      message: "package.json is invalid JSON.",
      severity: "error",
      type: "lockfile",
    });
    return diagnostics;
  }

  // Check which lockfiles are present
  const lockfiles = [
    { file: "bun.lockb", pm: "bun" },
    { file: "bun.lock", pm: "bun" },
    { file: "pnpm-lock.yaml", pm: "pnpm" },
    { file: "package-lock.json", pm: "npm" },
  ];

  const presentLockfiles = lockfiles.filter((lf) => existsSync(join(projectDir, lf.file)));

  if (presentLockfiles.length === 0) {
    diagnostics.push({
      fixable: false,
      id: "lockfile-missing",
      message: "No lockfile detected (bun.lockb/bun.lock, pnpm-lock.yaml, or package-lock.json).",
      severity: "warning",
      type: "lockfile",
    });
  } else if (presentLockfiles.length > 1) {
    const names = presentLockfiles.map((lf) => lf.file).join(", ");
    diagnostics.push({
      fixable: true,
      id: "lockfile-conflicts",
      message: `Multiple conflicting lockfiles detected: ${names}.`,
      severity: "warning",
      type: "lockfile",
    });
  }

  // Determine active package manager
  let activePm: string | undefined;
  if (typeof packageManagerField === "string") {
    if (packageManagerField.startsWith("bun")) {
      activePm = "bun";
    } else if (packageManagerField.startsWith("pnpm")) {
      activePm = "pnpm";
    } else if (packageManagerField.startsWith("npm")) {
      activePm = "npm";
    }
  }

  if (activePm === undefined && presentLockfiles.length > 0) {
    activePm = presentLockfiles[0].pm;
  }

  if (activePm !== undefined) {
    // Check if the present lockfile matches active PM
    const mismatch = presentLockfiles.filter((lf) => lf.pm !== activePm);
    if (mismatch.length > 0) {
      diagnostics.push({
        fixable: true,
        id: "package-manager-mismatch",
        message: `Active package manager is ${activePm}, but conflicting lockfiles exist: ${mismatch.map((m) => m.file).join(", ")}.`,
        severity: "warning",
        type: "lockfile",
      });
    } else {
      diagnostics.push({
        fixable: false,
        id: "lockfile-ok",
        message: `Package manager and lockfile are consistent (${activePm}).`,
        severity: "ok",
        type: "lockfile",
      });
    }
  }

  return diagnostics;
};

export const runTurborepoAudit = (
  projectDir: string,
  manifest: VernoManifest | null,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const state = detectProjectState(projectDir);

  const isMonorepo = state.isMonorepo || (manifest?.addons.includes("turborepo") ?? false);

  if (!isMonorepo) {
    diagnostics.push({
      fixable: false,
      id: "turborepo-not-monorepo",
      message: "Project is configured as a single-app structure (non-monorepo).",
      severity: "ok",
      type: "turborepo",
    });
    return diagnostics;
  }

  // Check turbo.json
  const turboPath = join(projectDir, "turbo.json");
  if (existsSync(turboPath)) {
    try {
      JSON.parse(readFileSync(turboPath, "utf-8"));
      diagnostics.push({
        fixable: false,
        id: "turbo-json-ok",
        message: "turbo.json exists and is valid JSON.",
        severity: "ok",
        type: "turborepo",
      });
    } catch {
      diagnostics.push({
        fixable: false,
        id: "turbo-json-invalid",
        message: "turbo.json is malformed or invalid JSON.",
        severity: "error",
        type: "turborepo",
      });
    }
  } else {
    diagnostics.push({
      fixable: false,
      id: "turbo-json-missing",
      message: "turbo.json is missing in a monorepo setup.",
      severity: "error",
      type: "turborepo",
    });
  }

  // Check workspaces packages
  const packagesDir = join(projectDir, "packages");
  if (existsSync(packagesDir)) {
    const dsPath = join(packagesDir, "design-system");
    const tcPath = join(packagesDir, "typescript-config");

    if (manifest?.packages.includes("design-system") && !existsSync(dsPath)) {
      diagnostics.push({
        fixable: false,
        id: "workspace-design-system-missing",
        message: "Workspace package 'design-system' is missing under packages/.",
        severity: "error",
        type: "turborepo",
      });
    }

    if (manifest?.packages.includes("typescript-config") && !existsSync(tcPath)) {
      diagnostics.push({
        fixable: false,
        id: "workspace-typescript-config-missing",
        message: "Workspace package 'typescript-config' is missing under packages/.",
        severity: "error",
        type: "turborepo",
      });
    }
  } else {
    diagnostics.push({
      fixable: false,
      id: "packages-dir-missing",
      message: "packages/ directory is missing in monorepo setup.",
      severity: "error",
      type: "turborepo",
    });
  }

  return diagnostics;
};

export const runShadcnAudit = (
  projectDir: string,
  manifest: VernoManifest | null,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const state = detectProjectState(projectDir);

  const expectShadcn = state.hasShadcn || manifest?.ui === "shadcn";

  if (!expectShadcn) {
    diagnostics.push({
      fixable: false,
      id: "shadcn-not-expected",
      message: "shadcn/ui is not configured or expected for this project.",
      severity: "ok",
      type: "shadcn",
    });
    return diagnostics;
  }

  const isMonorepo = state.isMonorepo || (manifest?.addons.includes("turborepo") ?? false);
  const targetDir = isMonorepo ? join(projectDir, "packages", "design-system") : projectDir;
  const configPath = join(targetDir, "components.json");

  if (existsSync(configPath)) {
    try {
      JSON.parse(readFileSync(configPath, "utf-8"));
      diagnostics.push({
        fixable: false,
        id: "shadcn-ok",
        message: "shadcn config (components.json) exists and is valid.",
        severity: "ok",
        type: "shadcn",
      });
    } catch {
      diagnostics.push({
        fixable: false,
        id: "shadcn-components-json-invalid",
        message: "components.json is malformed or invalid JSON.",
        severity: "error",
        type: "shadcn",
      });
    }
  } else {
    diagnostics.push({
      fixable: false,
      id: "shadcn-components-json-missing",
      message: `components.json is missing (expected path: ${isMonorepo ? "packages/design-system/components.json" : "components.json"}).`,
      severity: "warning",
      type: "shadcn",
    });
  }

  return diagnostics;
};

export const runUltraciteAudit = (
  projectDir: string,
  manifest: VernoManifest | null,
): Diagnostic[] => {
  const diagnostics: Diagnostic[] = [];
  const state = detectProjectState(projectDir);

  const expectUltracite = state.hasUltracite || (manifest?.addons.includes("ultracite") ?? false);

  if (!expectUltracite) {
    diagnostics.push({
      fixable: false,
      id: "ultracite-not-expected",
      message: "Ultracite linter/formatter is not configured or expected for this project.",
      severity: "ok",
      type: "ultracite",
    });
    return diagnostics;
  }

  const pkgPath = join(projectDir, "package.json");
  let hasUltraciteDep = false;

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as Record<string, unknown>;
      const deps = {
        ...(pkg.dependencies as Record<string, unknown> | undefined),
        ...(pkg.devDependencies as Record<string, unknown> | undefined),
      };
      hasUltraciteDep = "ultracite" in deps;
    } catch {
      // Handled by lockfile audit
    }
  }

  if (!hasUltraciteDep) {
    diagnostics.push({
      fixable: false,
      id: "ultracite-dep-missing",
      message: "Ultracite dependency is missing from package.json.",
      severity: "warning",
      type: "ultracite",
    });
  }

  // Check config references
  const ULTRACITE_CONFIG_FILES = [
    "oxlint.config.ts",
    "oxlint.config.js",
    "oxfmt.config.ts",
    "biome.json",
    "biome.jsonc",
    "eslint.config.mjs",
    "eslint.config.js",
  ];

  const presentConfigs = ULTRACITE_CONFIG_FILES.filter((file) =>
    existsSync(join(projectDir, file)),
  );

  if (presentConfigs.length === 0) {
    diagnostics.push({
      fixable: true,
      id: "ultracite-configs-missing",
      message: "Ultracite configuration files (oxlint/biome/eslint) are missing.",
      severity: "warning",
      type: "ultracite",
    });
  } else {
    diagnostics.push({
      fixable: false,
      id: "ultracite-ok",
      message: `Ultracite config detected (${presentConfigs.join(", ")}).`,
      severity: "ok",
      type: "ultracite",
    });
  }

  return diagnostics;
};

export const runFullAudit = (projectDir: string): Diagnostic[] => {
  const manifest = detectVernoManifest(projectDir);

  return [
    ...runManifestAudit(projectDir),
    ...runLockfileAudit(projectDir),
    ...runTurborepoAudit(projectDir, manifest),
    ...runShadcnAudit(projectDir, manifest),
    ...runUltraciteAudit(projectDir, manifest),
  ];
};
