import { ULTRACITE_LINTER_IDS, isUltraciteLinterId } from '../../ultracite-linter';
import type { UltraciteLinterId } from '../../ultracite-linter';

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
