import type { AddonId } from "@vernostudio/template-generator";
import { ADDON_IDS } from "@vernostudio/template-generator";
import { splitCommaList } from "./comma-list";

const isAddonId = (value: string): value is AddonId =>
  (ADDON_IDS as readonly string[]).includes(value);

export const parseAddonsArg = (raw: string | undefined): AddonId[] => {
  const out: AddonId[] = [];
  for (const part of splitCommaList(raw)) {
    if (!isAddonId(part)) {
      throw new Error(`Invalid addon "${part}". Use: ${ADDON_IDS.join(", ")}`);
    }
    if (!out.includes(part)) {
      out.push(part);
    }
  }
  return out;
};
