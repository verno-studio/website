import type { PackageManager } from "@vernostudio/template-generator";
import { isPackageManager, PACKAGE_MANAGERS } from "../shared/input-primitives";

/** Raw CLI flags for `verno doctor`. */
export interface DoctorCommandOptions {
  readonly yes: boolean;
  readonly fix: boolean;
  readonly packageManager?: string;
}

export const toDoctorCommandOptions = (raw: {
  readonly yes?: boolean;
  readonly fix?: boolean;
  readonly packageManager?: string;
}): DoctorCommandOptions => ({
  fix: raw.fix ?? false,
  packageManager: raw.packageManager,
  yes: raw.yes ?? false,
});

/** Normalized inputs for `verno doctor`. */
export interface ResolvedDoctorInputs {
  readonly fix: boolean;
  readonly yes: boolean;
  readonly packageManager?: PackageManager;
}

export const resolveDoctorInputs = (options: DoctorCommandOptions): ResolvedDoctorInputs => {
  let packageManager: PackageManager | undefined;
  if (options.packageManager !== undefined) {
    if (!isPackageManager(options.packageManager)) {
      throw new Error(`Invalid --package-manager. Use: ${PACKAGE_MANAGERS.join(" | ")}`);
    }
    ({ packageManager } = options);
  }

  return {
    fix: options.fix || options.yes,
    packageManager,
    yes: options.yes,
  };
};
