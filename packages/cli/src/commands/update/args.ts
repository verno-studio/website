import type { PackageManager } from "@vernostudio/template-generator";
import { isPackageManager, PACKAGE_MANAGERS } from "../shared/input-primitives";

/** Raw CLI flags for `verno update`. */
export interface UpdateCommandOptions {
  readonly yes: boolean;
  readonly dryRun: boolean;
  readonly install: boolean;
  readonly packageManager?: string;
}

export const toUpdateCommandOptions = (raw: {
  readonly yes?: boolean;
  readonly dryRun?: boolean;
  readonly install?: boolean;
  readonly packageManager?: string;
}): UpdateCommandOptions => ({
  dryRun: raw.dryRun ?? false,
  install: raw.install ?? true,
  packageManager: raw.packageManager,
  yes: raw.yes ?? false,
});

/** Normalized inputs for `verno update`. */
export interface ResolvedUpdateInputs {
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly install: boolean;
  readonly packageManager?: PackageManager;
}

export const resolveUpdateInputs = (options: UpdateCommandOptions): ResolvedUpdateInputs => {
  let packageManager: PackageManager | undefined;
  if (options.packageManager !== undefined) {
    if (!isPackageManager(options.packageManager)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    ({ packageManager } = options);
  }

  return {
    dryRun: options.dryRun,
    install: options.install,
    packageManager,
    yes: options.yes,
  };
};
