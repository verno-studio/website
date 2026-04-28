/** Values for `ultracite init --linter` (Ultracite owns presets and extra tooling). */
export type UltraciteLinterId = "biome" | "eslint" | "oxlint";

export const ULTRACITE_LINTER_IDS: readonly UltraciteLinterId[] = ["biome", "eslint", "oxlint"];

/** Default `--linter` for `ultracite init --quiet` when the flag is omitted. */
export const DEFAULT_ULTRACITE_LINTER: UltraciteLinterId = "oxlint";

export const isUltraciteLinterId = (value: string | undefined): value is UltraciteLinterId =>
  value !== undefined && (ULTRACITE_LINTER_IDS as readonly string[]).includes(value);
