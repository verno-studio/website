import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readCliPackageVersion } from "../../cli-version";
import { detectVernoManifest } from "../shared/manifest";
import { detectProjectState } from "../init/detect";
import { VERNO_APP_GLOBALS_BASE_MARKER } from "../../constants";

export interface UpdateCheck {
  readonly id: string;
  readonly category: "version" | "config" | "deps" | "css";
  readonly description: string;
  readonly current: string;
  readonly expected: string;
  readonly needsUpdate: boolean;
  readonly details?: string;
  readonly skipReason?: string;
}

export const EXPECTED_ULTRACITE_VERSION = "^7.7.0";

export const checkCliVersion = (manifestVersion: string): UpdateCheck => {
  const currentCliVersion = readCliPackageVersion();
  const needsUpdate = manifestVersion !== currentCliVersion;

  return {
    category: "version",
    current: manifestVersion,
    description: "Verno manifest generator version",
    expected: currentCliVersion,
    id: "manifest-version",
    needsUpdate,
  };
};

export const checkLatestPublishedVersion = async (): Promise<UpdateCheck | null> => {
  const currentCliVersion = readCliPackageVersion();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://registry.npmjs.org/@vernostudio/cli/latest", {
      signal: controller.signal,
    });
    clearTimeout(id);

    if (res.ok) {
      const data = (await res.json()) as { version?: string };
      const latestVersion = data.version;
      if (latestVersion !== undefined && latestVersion !== currentCliVersion) {
        return {
          category: "version",
          current: currentCliVersion,
          description: "Installed Verno CLI version",
          details: `A newer CLI version (${latestVersion}) is available on npm. Update with: bun add -D @vernostudio/cli@latest`,
          expected: latestVersion,
          id: "cli-npm-version",
          needsUpdate: true,
        };
      }
    }
  } catch {
    // Gracefully handle network errors/timeouts
  }
  return null;
};

export const checkUltraciteDep = (projectDir: string): UpdateCheck => {
  const pkgPath = join(projectDir, "package.json");
  let currentVersion = "missing";
  let hasUltracite = false;

  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
        devDependencies?: Record<string, string>;
        dependencies?: Record<string, string>;
      };
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if ("ultracite" in deps) {
        currentVersion = deps.ultracite ?? "missing";
        hasUltracite = true;
      }
    } catch {
      // Ignored
    }
  }

  const needsUpdate = hasUltracite && currentVersion !== EXPECTED_ULTRACITE_VERSION;

  return {
    category: "deps",
    current: currentVersion,
    description: "ultracite dependency in package.json",
    expected: EXPECTED_ULTRACITE_VERSION,
    id: "ultracite-dep",
    needsUpdate,
  };
};

const isCanonicalOxlintConfig = (content: string): boolean =>
  content.includes("ultracite/presets/oxlint");

const isCanonicalOxfmtConfig = (content: string): boolean =>
  content.includes("ultracite/presets/oxfmt");

export const checkOxlintConfig = (projectDir: string): UpdateCheck => {
  const path = join(projectDir, "oxlint.config.ts");
  let current = "missing";
  let needsUpdate = false;
  let skipReason: string | undefined;

  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf-8");
      if (isCanonicalOxlintConfig(content)) {
        current = "canonical";
      } else {
        current = "customized";
        skipReason = "Config file has been customized; skipping to preserve user changes.";
      }
    } catch {
      current = "error reading";
    }
  } else {
    needsUpdate = true;
  }

  return {
    category: "config",
    current,
    description: "oxlint.config.ts configuration file",
    expected: "canonical",
    id: "oxlint-config",
    needsUpdate,
    skipReason,
  };
};

export const checkOxfmtConfig = (projectDir: string): UpdateCheck => {
  const path = join(projectDir, "oxfmt.config.ts");
  let current = "missing";
  let needsUpdate = false;
  let skipReason: string | undefined;

  if (existsSync(path)) {
    try {
      const content = readFileSync(path, "utf-8");
      if (isCanonicalOxfmtConfig(content)) {
        current = "canonical";
      } else {
        current = "customized";
        skipReason = "Config file has been customized; skipping to preserve user changes.";
      }
    } catch {
      current = "error reading";
    }
  } else {
    needsUpdate = true;
  }

  return {
    category: "config",
    current,
    description: "oxfmt.config.ts configuration file",
    expected: "canonical",
    id: "oxfmt-config",
    needsUpdate,
    skipReason,
  };
};

export const checkGlobalsCssBaseLayer = (projectDir: string, isMonorepo: boolean): UpdateCheck => {
  const globalsCssPath = isMonorepo
    ? join(projectDir, "apps", "web", "app", "globals.css")
    : join(projectDir, "app", "globals.css");

  let current = "missing";
  let needsUpdate = false;

  if (existsSync(globalsCssPath)) {
    try {
      const content = readFileSync(globalsCssPath, "utf-8");
      if (content.includes(VERNO_APP_GLOBALS_BASE_MARKER)) {
        current = "present";
      } else {
        current = "missing base layer";
        needsUpdate = true;
      }
    } catch {
      current = "error reading";
    }
  } else {
    current = "no globals.css";
  }

  return {
    category: "css",
    current,
    description: "globals.css Verno base layer",
    expected: "present",
    id: "globals-css-layer",
    needsUpdate,
  };
};

export const runUpdateChecks = async (projectDir: string): Promise<UpdateCheck[]> => {
  const checks: UpdateCheck[] = [];
  const manifest = detectVernoManifest(projectDir);
  const state = detectProjectState(projectDir);

  if (manifest === null) {
    checks.push({
      category: "version",
      current: "missing",
      description: "Verno manifest generator version",
      expected: readCliPackageVersion(),
      id: "manifest-version",
      needsUpdate: false,
      skipReason: "Manifest is missing. Run `verno doctor --fix` to reconstruct it.",
    });
  } else {
    checks.push(checkCliVersion(manifest.generatorVersion));
  }

  // 2. Fetch latest version from npm registry asynchronously
  const npmCheck = await checkLatestPublishedVersion();
  if (npmCheck !== null) {
    checks.push(npmCheck);
  }

  // 3. Check ultracite dep if it is expected/manifested
  const expectUltracite = state.hasUltracite || (manifest?.addons.includes("ultracite") ?? false);
  if (expectUltracite) {
    checks.push(checkUltraciteDep(projectDir));

    // Only check configs for oxlint linter
    const linter = manifest?.ultraciteLinter ?? "oxlint";
    if (linter === "oxlint") {
      checks.push(checkOxlintConfig(projectDir));
      checks.push(checkOxfmtConfig(projectDir));
    }
  }

  // 4. Check CSS layer
  checks.push(checkGlobalsCssBaseLayer(projectDir, state.isMonorepo));

  return checks;
};
