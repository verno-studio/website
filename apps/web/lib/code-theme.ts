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

export const languageOf = (filePath: string) =>
  LANGUAGES[filePath.split(".").pop() ?? ""] ?? "text";
