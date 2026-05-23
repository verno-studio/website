export const splitCommaList = (raw: string | undefined): string[] =>
  raw === undefined || raw.trim().length === 0
    ? []
    : raw
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
