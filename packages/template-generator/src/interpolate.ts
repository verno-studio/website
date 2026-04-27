const PLACEHOLDER = /\{\{(\w+)\}\}/g;

export const interpolate = (raw: string, vars: Readonly<Record<string, string>>): string =>
  raw.replace(PLACEHOLDER, (full, key: string) =>
    key in vars ? (vars as Record<string, string>)[key] : full,
  );
