import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getRegistries } from "@vernostudio/template-generator";

/**
 * `shadcn apply` rewrites `components.json` wholesale, dropping the `registries`
 * block the templates ship. Same problem, and same fix, as the base CSS layer in
 * `app-globals.ts`: put it back afterwards rather than trying to stop shadcn
 * from touching the file.
 *
 * Only missing namespaces are added — a project that has repointed `@vernostudio`
 * at a fork, or added registries of its own, keeps what it chose.
 */
export const getComponentsJsonPath = (projectDir: string, monorepo: boolean): string =>
  monorepo
    ? path.join(projectDir, "apps", "web", "components.json")
    : path.join(projectDir, "components.json");

export const ensureComponentsJsonRegistriesContent = (content: string): string => {
  const parsed: unknown = JSON.parse(content);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return content;
  }

  const config = parsed as Record<string, unknown>;
  const { registries: existing } = config;
  const registries: Record<string, unknown> =
    typeof existing === "object" && existing !== null && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  let changed = false;
  for (const [namespace, url] of Object.entries(getRegistries())) {
    if (!(namespace in registries)) {
      registries[namespace] = url;
      changed = true;
    }
  }

  if (!changed) {
    return content;
  }

  return `${JSON.stringify({ ...config, registries }, null, 2)}\n`;
};

export const ensureComponentsJsonRegistries = async (
  projectDir: string,
  monorepo: boolean,
): Promise<void> => {
  const configPath = getComponentsJsonPath(projectDir, monorepo);
  if (!existsSync(configPath)) {
    return;
  }

  const raw = await readFile(configPath, "utf-8");
  let next: string;
  try {
    next = ensureComponentsJsonRegistriesContent(raw);
  } catch {
    // Malformed components.json is the doctor's problem, not ours; leaving it
    // untouched keeps the error the user sees pointing at the real cause.
    return;
  }

  if (next !== raw) {
    await writeFile(configPath, next, "utf-8");
  }
};
