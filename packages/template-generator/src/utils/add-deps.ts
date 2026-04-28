import type { VirtualFileSystem } from "../core/virtual-fs";
import { packageJsonString } from "../templates/strings";

export const dependencyVersionMap = {
  "@tailwindcss/postcss": "^4.0.0",
  "@types/node": "^25",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@typescript/native-preview": "^7.0.0-dev.20260427.1",
  "class-variance-authority": "^0.7.1",
  clsx: "^2.1.1",
  next: "^16.2.0",
  oxfmt: "^0.46.0",
  oxlint: "^1.61.0",
  "radix-ui": "^1.4.3",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  shadcn: "^4.5.0",
  "tailwind-merge": "^3.5.0",
  tailwindcss: "^4.0.0",
  turbo: "^2.9.0",
  "tw-animate-css": "^1.4.0",
  typescript: "^6",
  ultracite: "^7.6.0",
} as const;

export type AvailableDependencies = keyof typeof dependencyVersionMap;

export type PackageJsonRecord = Record<string, unknown>;

type DepSectionKey = "dependencies" | "devDependencies" | "peerDependencies";

const asDepRecord = (v: unknown): Record<string, string> =>
  v !== null && typeof v === "object" && !Array.isArray(v)
    ? { ...(v as Record<string, string>) }
    : {};

const mergeDepSection = (
  pkg: PackageJsonRecord,
  key: DepSectionKey,
  names: readonly AvailableDependencies[] | undefined,
): void => {
  if (names === undefined) {
    return;
  }
  const record: Record<string, string> = asDepRecord(pkg[key]);
  pkg[key] = record;
  for (const name of names) {
    if (record[name] === undefined) {
      record[name] = dependencyVersionMap[name];
    }
  }
};

const mergeCustomStrings = (
  pkg: PackageJsonRecord,
  key: "dependencies" | "devDependencies",
  custom: Readonly<Record<string, string>>,
): void => {
  if (Object.keys(custom).length === 0) {
    return;
  }
  const record: Record<string, string> = asDepRecord(pkg[key]);
  pkg[key] = record;
  for (const [dep, version] of Object.entries(custom)) {
    record[dep] = version;
  }
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

export const getDependencyVersion = (name: AvailableDependencies): string =>
  dependencyVersionMap[name];

export interface AddPackageDependencyOptions {
  readonly vfs: VirtualFileSystem;
  readonly packagePath: string;
  readonly dependencies?: readonly AvailableDependencies[];
  readonly devDependencies?: readonly AvailableDependencies[];
  readonly peerDependencies?: readonly AvailableDependencies[];
  readonly customDependencies?: Readonly<Record<string, string>>;
  readonly customDevDependencies?: Readonly<Record<string, string>>;
}

export const addPackageDependency = (options: AddPackageDependencyOptions): void => {
  const {
    vfs,
    packagePath,
    dependencies,
    devDependencies,
    peerDependencies,
    customDependencies = {},
    customDevDependencies = {},
  } = options;

  const raw = vfs.readFile(packagePath);
  if (raw === undefined) {
    throw new Error(`Missing file in tree: ${packagePath}`);
  }

  const pkg = parsePackageJson(raw);

  mergeDepSection(pkg, "dependencies", dependencies);
  mergeDepSection(pkg, "devDependencies", devDependencies);
  mergeDepSection(pkg, "peerDependencies", peerDependencies);

  mergeCustomStrings(pkg, "dependencies", customDependencies);
  mergeCustomStrings(pkg, "devDependencies", customDevDependencies);

  vfs.writeJson(packagePath, pkg);
};
