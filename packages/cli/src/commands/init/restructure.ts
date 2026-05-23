import { existsSync, mkdirSync, renameSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PackageJsonRecord, PackageManager } from "@vernostudio/template-generator";
import { detectPackageJson } from "./detect";

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
