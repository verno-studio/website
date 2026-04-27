import type { ProjectConfig } from "../config";
import { buildTemplateVarMap } from "../build-template-vars";
import { interpolate } from "../interpolate";

/** Interpolate `{{var}}` placeholders using the project config. */
export const applyTemplateVars = (raw: string, config: ProjectConfig): string =>
  interpolate(raw, buildTemplateVarMap(config));
