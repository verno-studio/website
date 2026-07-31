/**
 * Frameworks Verno knows about, used for wizard choices and typo warnings.
 * Ultracite's own CLI is the real validator: ids Verno does not recognize
 * pass through with a warning, so presets added upstream work from a flag
 * without waiting for a Verno release.
 */
export const ULTRACITE_FRAMEWORK_IDS: readonly string[] = [
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
];

/** Default `--frameworks` for Verno Next.js scaffold when the flag is omitted in `-y` mode. */
export const DEFAULT_ULTRACITE_FRAMEWORKS: readonly string[] = ["react", "next"];

/** Parses comma- or space-separated framework ids; dedupes while preserving order and warns on ids Verno does not know. */
export const parseUltraciteFrameworksArg = (raw: string | undefined): string[] => {
  if (raw === undefined || raw.length === 0) {
    return [];
  }
  const parts = raw
    .split(/[,\s]+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const out: string[] = [];
  for (const part of parts) {
    if (!out.includes(part)) {
      out.push(part);
    }
  }
  const unknown = out.filter((id) => !ULTRACITE_FRAMEWORK_IDS.includes(id));
  if (unknown.length > 0) {
    process.stderr.write(
      `Warning: ${unknown.map((id) => `"${id}"`).join(", ")} not in Verno's known framework list; passing through for ultracite init to validate.\n`,
    );
  }
  return out;
};
