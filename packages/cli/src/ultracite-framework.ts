/** Values for `ultracite init --frameworks` (Ultracite preset extends). */
export type UltraciteFrameworkId =
  | "angular"
  | "astro"
  | "nestjs"
  | "next"
  | "qwik"
  | "react"
  | "remix"
  | "solid"
  | "svelte"
  | "tanstack"
  | "vue";

export const ULTRACITE_FRAMEWORK_IDS: readonly UltraciteFrameworkId[] = [
  "react",
  "next",
  "solid",
  "vue",
  "svelte",
  "qwik",
  "remix",
  "tanstack",
  "angular",
  "astro",
  "nestjs",
] as const;

/** Default `--frameworks` for Verno Next.js scaffold when the flag is omitted in `-y` mode. */
export const DEFAULT_ULTRACITE_FRAMEWORKS: readonly UltraciteFrameworkId[] = ["react", "next"];

export const isUltraciteFrameworkId = (value: string | undefined): value is UltraciteFrameworkId =>
  value !== undefined && (ULTRACITE_FRAMEWORK_IDS as readonly string[]).includes(value);

/** Parses comma- or space-separated framework ids; dedupes while preserving order. */
export const parseUltraciteFrameworksArg = (raw: string | undefined): UltraciteFrameworkId[] => {
  if (raw === undefined || raw.length === 0) {
    return [];
  }
  const parts = raw
    .split(/[,\s]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const out: UltraciteFrameworkId[] = [];
  for (const part of parts) {
    if (!isUltraciteFrameworkId(part)) {
      throw new Error(`Invalid framework "${part}". Use: ${ULTRACITE_FRAMEWORK_IDS.join(" | ")}`);
    }
    if (!out.includes(part)) {
      out.push(part);
    }
  }
  return out;
};
