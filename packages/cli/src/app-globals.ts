import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { VERNO_APP_GLOBALS_BASE_LAYER, VERNO_APP_GLOBALS_BASE_MARKER } from "./constants";

const trimEndWhitespace = (value: string): string => value.replace(/\s+$/u, "");

export const getAppGlobalsCssPath = (projectDir: string, monorepo: boolean): string =>
  monorepo
    ? join(projectDir, "apps", "web", "app", "globals.css")
    : join(projectDir, "app", "globals.css");

const stripAppGlobalsBaseLayer = (content: string): string => {
  const markerIndex = content.indexOf(VERNO_APP_GLOBALS_BASE_MARKER);
  if (markerIndex === -1) {
    return trimEndWhitespace(content);
  }
  const layerStart = content.indexOf("@layer base", markerIndex);
  if (layerStart === -1) {
    return trimEndWhitespace(content.slice(0, markerIndex));
  }
  const blockOpen = content.indexOf("{", layerStart);
  if (blockOpen === -1) {
    return trimEndWhitespace(content.slice(0, markerIndex));
  }
  let depth = 0;
  for (let i = blockOpen; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        const before = content.slice(0, markerIndex);
        const after = content.slice(i + 1).replace(/^\s*\n/u, "");
        return trimEndWhitespace(before + after);
      }
    }
  }
  return trimEndWhitespace(content.slice(0, markerIndex));
};

export const ensureAppGlobalsBaseLayerContent = (content: string): string => {
  const stripped = stripAppGlobalsBaseLayer(content);
  const needsNewlineBeforeBlock = stripped.length > 0 && !stripped.endsWith("\n");
  const gap = needsNewlineBeforeBlock ? "\n" : "";
  return `${stripped}${gap}${VERNO_APP_GLOBALS_BASE_LAYER}\n`;
};

export const ensureAppGlobalsBaseLayerAtEnd = async (
  projectDir: string,
  monorepo: boolean,
): Promise<void> => {
  const path = getAppGlobalsCssPath(projectDir, monorepo);
  if (!existsSync(path)) {
    return;
  }
  const raw = await readFile(path, "utf-8");
  const next = ensureAppGlobalsBaseLayerContent(raw);
  if (next !== raw) {
    await writeFile(path, next, "utf-8");
  }
};
