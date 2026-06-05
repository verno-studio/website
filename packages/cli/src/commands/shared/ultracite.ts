import { ULTRACITE_LINTER_IDS, isUltraciteLinterId } from "../../ultracite-linter";
import type { UltraciteLinterId } from "../../ultracite-linter";
import { parseUltraciteFrameworksArg } from "../../ultracite-framework";
import type { UltraciteFrameworkId } from "../../ultracite-framework";

export const parseUltraciteLinterFlag = (
  options: { readonly linter?: string },
  ultraciteOn: boolean,
): UltraciteLinterId | undefined => {
  if (!ultraciteOn) {
    if (options.linter !== undefined && options.linter.length > 0) {
      throw new Error("--linter requires ultracite in --addons.");
    }
    return undefined;
  }
  const raw = options.linter;
  if (raw !== undefined && raw.length > 0) {
    if (!isUltraciteLinterId(raw)) {
      throw new Error(`Invalid --linter. Use: ${ULTRACITE_LINTER_IDS.join(" | ")}`);
    }
    return raw;
  }
  return undefined;
};

export const parseUltraciteFrameworksFlag = (
  options: { readonly frameworks?: string },
  ultraciteOn: boolean,
): UltraciteFrameworkId[] | undefined => {
  if (!ultraciteOn) {
    if (options.frameworks !== undefined && options.frameworks.length > 0) {
      throw new Error("--frameworks requires ultracite in --addons.");
    }
    return undefined;
  }
  const raw = options.frameworks;
  if (raw === undefined || raw.length === 0) {
    return undefined;
  }
  const parsed = parseUltraciteFrameworksArg(raw);
  if (parsed.length === 0) {
    throw new Error("At least one framework is required for --frameworks.");
  }
  return parsed;
};
