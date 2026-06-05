import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type {
  AddonId,
  FrontendId,
  PackageId,
  PackageManager,
} from "@vernostudio/template-generator";
import type { UltraciteFrameworkId } from "../../ultracite-framework";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { readCliPackageVersion } from "../../cli-version";
import { VERNO_MANIFEST_DIR } from "../../constants";
import type { ResolvedCreateInputs, UiMode } from "../create/args";
import type { ResolvedInitInputs } from "../init/args";

export interface VernoManifest {
  readonly addons: readonly AddonId[];
  readonly createdAt: string;
  readonly frontend: FrontendId;
  readonly generator: "verno";
  readonly generatorVersion: string;
  readonly packageManager: PackageManager;
  readonly packages: readonly PackageId[];
  readonly projectName: string;
  readonly shadcnPreset?: string;
  readonly studio: "Verno Studio";
  readonly ui: UiMode;
  readonly ultraciteLinter?: UltraciteLinterId;
  readonly ultraciteFrameworks?: readonly UltraciteFrameworkId[];
}

export const mergeManifestAddons = (
  existing: VernoManifest | null,
  newAddons: AddonId[],
): AddonId[] => {
  const existingAddons = existing?.addons ?? [];
  return [...new Set([...existingAddons, ...newAddons])] as AddonId[];
};

export const buildVernoManifestForCreate = (args: {
  readonly resolved: ResolvedCreateInputs;
  readonly projectName: string;
}): VernoManifest => ({
  addons: args.resolved.addons,
  createdAt: new Date().toISOString(),
  frontend: args.resolved.frontend,
  generator: "verno",
  generatorVersion: readCliPackageVersion(),
  packageManager: args.resolved.packageManager,
  packages: args.resolved.packages,
  projectName: args.projectName,
  shadcnPreset: args.resolved.useShadcn ? args.resolved.shadcnPreset : undefined,
  studio: "Verno Studio",
  ui: args.resolved.ui,
  ultraciteFrameworks: args.resolved.runUltracite ? args.resolved.ultraciteFrameworks : undefined,
  ultraciteLinter: args.resolved.runUltracite ? args.resolved.ultraciteLinter : undefined,
});

export const buildVernoManifestForInit = (args: {
  readonly existing: VernoManifest | null;
  readonly projectName: string;
  readonly resolved: ResolvedInitInputs;
}): VernoManifest => ({
  addons: mergeManifestAddons(args.existing, args.resolved.addons),
  createdAt: args.existing?.createdAt ?? new Date().toISOString(),
  frontend: "next",
  generator: "verno",
  generatorVersion: readCliPackageVersion(),
  packageManager: args.resolved.packageManager,
  packages: (args.existing?.packages ?? []) as PackageId[],
  projectName: args.projectName,
  shadcnPreset: args.resolved.useShadcn ? args.resolved.shadcnPreset : undefined,
  studio: "Verno Studio",
  ui: args.resolved.ui,
  ultraciteFrameworks: args.resolved.runUltracite ? args.resolved.ultraciteFrameworks : undefined,
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

const isStringArray = (value: unknown): value is readonly string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isVernoManifestRecord = (value: unknown): value is VernoManifest => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.generator === "verno" &&
    typeof record.projectName === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.frontend === "string" &&
    typeof record.packageManager === "string" &&
    typeof record.ui === "string" &&
    isStringArray(record.addons) &&
    isStringArray(record.packages)
  );
};

export const detectVernoManifest = (projectDir: string): VernoManifest | null => {
  const path = join(projectDir, VERNO_MANIFEST_DIR, "manifest.json");
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return isVernoManifestRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
