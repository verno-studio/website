/**
 * One theme pair for every highlighted block on the site. MDX code fences go
 * through `source.config.ts` and registry sources go through `highlight()` at
 * render time; both read this so a hand-written snippet and a published file
 * cannot end up in different themes.
 */
export const codeThemes = {
  dark: "github-dark-high-contrast",
  light: "github-light-high-contrast",
} as const;

const LANGUAGES: Record<string, string> = {
  css: "css",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
};

/** Shiki needs a language, and a registry file only carries a path. */
export const languageOf = (filePath: string) =>
  LANGUAGES[filePath.split(".").pop() ?? ""] ?? "text";
