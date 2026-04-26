import { packageJsonString } from "../templates/strings";
import { getDependencyVersion } from "./dependencies";
import type { ManagedDependency } from "./dependencies";

export type PackageJsonRecord = Record<string, unknown>;

const asDepRecord = (v: unknown): Record<string, string> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? { ...(v as Record<string, string>) }
    : {};

type DepSectionKey = "dependencies" | "devDependencies" | "peerDependencies";

const mergeDepSection = (
  pkg: PackageJsonRecord,
  key: DepSectionKey,
  names: readonly ManagedDependency[] | undefined,
): void => {
  if (names === undefined) {
    return;
  }
  const record: Record<string, string> = asDepRecord(pkg[key]);
  pkg[key] = record;
  for (const name of names) {
    if (record[name] === undefined) {
      record[name] = getDependencyVersion(name);
    }
  }
};

export const mergeDependenciesFromCatalog = (
  pkg: PackageJsonRecord,
  options: {
    readonly dependencies?: readonly ManagedDependency[];
    readonly devDependencies?: readonly ManagedDependency[];
    readonly peerDependencies?: readonly ManagedDependency[];
  },
): void => {
  mergeDepSection(pkg, "dependencies", options.dependencies);
  mergeDepSection(pkg, "devDependencies", options.devDependencies);
  mergeDepSection(pkg, "peerDependencies", options.peerDependencies);
};

export const parsePackageJson = (raw: string): PackageJsonRecord => {
  const parsed: unknown = JSON.parse(raw) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("package.json must be a JSON object");
  }
  return parsed as PackageJsonRecord;
};

export const stringifyPackageJson = (pkg: PackageJsonRecord): string => {
  if (!pkg || typeof pkg !== "object" || Array.isArray(pkg)) {
    throw new Error("Invalid package.json object");
  }
  return packageJsonString(pkg);
};
