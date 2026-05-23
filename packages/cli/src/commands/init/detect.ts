import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parsePackageJson } from "@vernostudio/template-generator";
import type { PackageJsonRecord, PackageManager } from "@vernostudio/template-generator";
import { detectVernoManifest } from "../shared/manifest";
import type { VernoManifest } from "../shared/manifest";

export const detectPackageJson = (projectDir: string): PackageJsonRecord | null => {
  const path = join(projectDir, "package.json");
  try {
    const raw = readFileSync(path, "utf-8");
    return parsePackageJson(raw);
  } catch {
    return null;
  }
};

export const detectShadcn = (projectDir: string, monorepo: boolean): boolean => {
  const workingDir = monorepo ? join(projectDir, "packages", "design-system") : projectDir;
  const configPath = join(workingDir, "components.json");
  return existsSync(configPath);
};

const ULTRACITE_CONFIG_FILES = [
  "oxlint.config.ts",
  "oxlint.config.js",
  "oxfmt.config.ts",
  "biome.json",
  "biome.jsonc",
  "eslint.config.mjs",
  "eslint.config.js",
] as const;

const configReferencesUltracite = (projectDir: string, fileName: string): boolean => {
  const path = join(projectDir, fileName);
  if (!existsSync(path)) {
    return false;
  }
  try {
    return readFileSync(path, "utf-8").includes("ultracite");
  } catch {
    return false;
  }
};

export const detectUltracite = (projectDir: string): boolean => {
  if (ULTRACITE_CONFIG_FILES.some((file) => configReferencesUltracite(projectDir, file))) {
    return true;
  }

  const pkg = detectPackageJson(projectDir);
  if (pkg === null) {
    return false;
  }

  const deps = {
    ...(pkg.dependencies as Record<string, unknown> | undefined),
    ...(pkg.devDependencies as Record<string, unknown> | undefined),
  };
  if (!("ultracite" in deps)) {
    return false;
  }

  const scripts = pkg.scripts as Record<string, unknown> | undefined;
  return (
    scripts !== undefined &&
    Object.values(scripts).some((value) => typeof value === "string" && value.includes("ultracite"))
  );
};

export const detectMonorepo = (projectDir: string): boolean => {
  const turboJson = join(projectDir, "turbo.json");
  const pnpmWorkspace = join(projectDir, "pnpm-workspace.yaml");
  return existsSync(turboJson) || existsSync(pnpmWorkspace);
};

export const detectPackageManager = (projectDir: string): PackageManager | null => {
  const pkg = detectPackageJson(projectDir);
  const pm = pkg?.packageManager;
  if (typeof pm === "string") {
    if (pm.startsWith("bun")) {
      return "bun";
    }
    if (pm.startsWith("pnpm")) {
      return "pnpm";
    }
    if (pm.startsWith("npm")) {
      return "npm";
    }
  }
  if (existsSync(join(projectDir, "bun.lockb"))) {
    return "bun";
  }
  if (existsSync(join(projectDir, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(projectDir, "package-lock.json"))) {
    return "npm";
  }
  return null;
};

export interface DetectedState {
  readonly projectName: string;
  readonly packageManager: PackageManager | null;
  readonly isMonorepo: boolean;
  readonly hasShadcn: boolean;
  readonly hasUltracite: boolean;
  readonly manifest: VernoManifest | null;
  readonly packageJson: PackageJsonRecord | null;
}

export const detectProjectState = (projectDir: string): DetectedState => {
  const pkgJson = detectPackageJson(projectDir);
  const mono = detectMonorepo(projectDir);

  let projectName = projectDir.split(/[/\\]/u).pop() ?? "project";
  const pkgName = pkgJson?.name as string | undefined;
  if (typeof pkgName === "string" && pkgName.length > 0) {
    projectName = pkgName.replace(/^@[^/]+\//u, "");
  }

  return {
    hasShadcn: detectShadcn(projectDir, mono),
    hasUltracite: detectUltracite(projectDir),
    isMonorepo: mono,
    manifest: detectVernoManifest(projectDir),
    packageJson: pkgJson,
    packageManager: detectPackageManager(projectDir),
    projectName,
  };
};

export const safeParsePackageJson = (raw: string): PackageJsonRecord | null => {
  try {
    return parsePackageJson(raw);
  } catch {
    return null;
  }
};
