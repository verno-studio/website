import { existsSync, readFileSync, mkdirSync, renameSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parsePackageJson } from "@vernostudio/template-generator";
import type { PackageJsonRecord, PackageManager, AddonId } from "@vernostudio/template-generator";
import type { ResolvedInitInputs, UiMode } from "./args";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { readCliPackageVersion } from "../../cli-version";
import { VERNO_MANIFEST_DIR } from "../../constants";

export interface VernoManifest {
  readonly addons: readonly AddonId[];
  readonly createdAt: string;
  readonly frontend: "next";
  readonly generator: "verno";
  readonly generatorVersion: string;
  readonly packageManager: PackageManager;
  readonly packages: readonly string[];
  readonly projectName: string;
  readonly shadcnPreset?: string;
  readonly studio: "Verno Studio";
  readonly ui: UiMode;
  readonly ultraciteLinter?: UltraciteLinterId;
}

export const mergeManifestAddons = (
  existing: VernoManifest | null,
  newAddons: AddonId[],
): AddonId[] => {
  const existingAddons = existing?.addons ?? [];
  return [...new Set([...existingAddons, ...newAddons])] as AddonId[];
};

export const buildVernoManifest = (args: {
  readonly existing: VernoManifest | null;
  readonly projectName: string;
  readonly resolved: ResolvedInitInputs;
}): VernoManifest => ({
  addons: mergeManifestAddons(args.existing, [...args.resolved.addons]),
  createdAt: args.existing?.createdAt ?? new Date().toISOString(),
  frontend: "next",
  generator: "verno",
  generatorVersion: readCliPackageVersion(),
  packageManager: args.resolved.packageManager,
  packages: args.existing?.packages ?? [],
  projectName: args.projectName,
  shadcnPreset: args.resolved.useShadcn ? args.resolved.shadcnPreset : undefined,
  studio: "Verno Studio",
  ui: args.resolved.ui,
  ultraciteLinter: args.resolved.runUltracite ? args.resolved.ultraciteLinter : undefined,
});

export const writeVernoManifest = async (
  projectDir: string,
  manifest: VernoManifest,
): Promise<void> => {
  const dir = join(projectDir, VERNO_MANIFEST_DIR);
  await mkdir(dir, { recursive: true });
  const out = join(dir, "manifest.json");
  await writeFile(out, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
};

export const detectPackageJson = (projectDir: string): PackageJsonRecord | null => {
  const path = join(projectDir, "package.json");
  try {
    const raw = readFileSync(path, "utf-8");
    return parsePackageJson(raw);
  } catch {
    return null;
  }
};

export const detectVernoManifest = (projectDir: string): VernoManifest | null => {
  const path = join(projectDir, VERNO_MANIFEST_DIR, "manifest.json");
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "generator" in parsed &&
      (parsed as Record<string, unknown>).generator === "verno"
    ) {
      return parsed as VernoManifest;
    }
    return null;
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

  let projectName = projectDir.split(/[/\\]/).pop() ?? "project";
  const pkgName = pkgJson?.name as string | undefined;
  if (typeof pkgName === "string" && pkgName.length > 0) {
    projectName = pkgName.replace(/^@[^/]+\//, "");
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

export const restructureForTurborepo = async (
  projectDir: string,
  packageManager: PackageManager,
): Promise<void> => {
  const dirsToCreate = [join(projectDir, "apps", "web"), join(projectDir, "packages")];

  for (const dir of dirsToCreate) {
    mkdirSync(dir, { recursive: true });
  }

  const filesToMove = [
    "src",
    "public",
    "next.config.ts",
    "next.config.js",
    "tailwind.config.ts",
    "tailwind.config.js",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "app",
    "components",
    "lib",
    "utils",
  ];

  const moved: string[] = [];
  for (const file of filesToMove) {
    const srcPath = join(projectDir, file);
    if (existsSync(srcPath)) {
      const destPath = join(projectDir, "apps", "web", file);
      if (existsSync(destPath)) {
        process.stderr.write(`\nWarning: ${file} already exists in apps/web/, skipping move.\n`);
        continue;
      }
      renameSync(srcPath, destPath);
      moved.push(file);
    }
  }

  if (moved.length > 0) {
    process.stdout.write(`Moved to apps/web/: ${moved.join(", ")}\n`);
  }

  const webPackageJson = {
    dependencies: {},
    name: "web",
    private: true,
    scripts: {
      build: "next build",
      dev: "next dev",
      start: "next start",
    },
    version: "0.1.0",
  };
  await writeFile(
    join(projectDir, "apps", "web", "package.json"),
    `${JSON.stringify(webPackageJson, null, 2)}\n`,
    "utf-8",
  );

  const turboJson = {
    $schema: "https://turbo.build/schema.json",
    extends: ["@vernostudio/turborepo-utils/turbo.json"],
    tasks: {
      build: {
        dependsOn: ["^build"],
        outputs: [".next/**"],
      },
      dev: {
        cache: false,
        dependsOn: ["^build"],
        persistent: true,
      },
      lint: {
        dependsOn: ["^build"],
      },
    },
  };
  await writeFile(
    join(projectDir, "turbo.json"),
    `${JSON.stringify(turboJson, null, 2)}\n`,
    "utf-8",
  );

  const existingPkg = detectPackageJson(projectDir);
  const rootPkg = existingPkg ?? ({ name: "project", private: true } as PackageJsonRecord);

  const rootScripts: Record<string, unknown> = rootPkg.scripts
    ? (rootPkg.scripts as Record<string, unknown>)
    : {};
  const filteredScripts = Object.fromEntries(
    Object.entries(rootScripts).filter(([key]) => !["dev", "build", "start", "lint"].includes(key)),
  );

  rootPkg.scripts = {
    ...filteredScripts,
    build: "turbo run build",
    dev: "turbo run dev",
    lint: "turbo run lint",
  } as PackageJsonRecord["scripts"];

  (rootPkg as Record<string, unknown>).workspaces = ["apps/*", "packages/*"];

  if (!(rootPkg as Record<string, unknown>).packageManager) {
    const pmVersions: Record<string, string> = {
      bun: "1.3.12",
      npm: "10.9.0",
      pnpm: "9.15.0",
    };
    (rootPkg as Record<string, unknown>).packageManager =
      `${packageManager}@${pmVersions[packageManager]}`;
  }

  await writeFile(
    join(projectDir, "package.json"),
    `${JSON.stringify(rootPkg, null, 2)}\n`,
    "utf-8",
  );

  process.stdout.write("Restructured project for turborepo monorepo layout.\n");
};

export const safeParsePackageJson = (raw: string): PackageJsonRecord | null => {
  try {
    return parsePackageJson(raw);
  } catch {
    return null;
  }
};
