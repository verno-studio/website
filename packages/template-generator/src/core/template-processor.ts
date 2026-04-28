import Handlebars from "handlebars";
import type { ProjectConfig } from "../config";
import { buildHandlebarsContext } from "../build-template-vars";

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

const compile = (raw: string): Handlebars.TemplateDelegate => {
  const hit = templateCache.get(raw);
  if (hit !== undefined) {
    return hit;
  }
  const tpl = Handlebars.compile(raw, { noEscape: true, strict: false });
  templateCache.set(raw, tpl);
  return tpl;
};

/** Renders a file body with Handlebars; missing helpers use defaults from Handlebars. */
export const applyTemplateVars = (raw: string, config: ProjectConfig): string =>
  compile(raw)(buildHandlebarsContext(config));

export const renderTemplatePathIfNeeded = (relativePath: string, config: ProjectConfig): string => {
  if (!relativePath.includes("{{")) {
    return relativePath;
  }
  return compile(relativePath)(buildHandlebarsContext(config)).trim();
};
