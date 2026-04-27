import type { TemplateId } from "../config";
import { TEMPLATE_LAYER_STACKS } from "../layers/registry";
import { EMBEDDED_BY_LAYER } from "../templates.generated";

const embedded = EMBEDDED_BY_LAYER as Record<string, ReadonlyMap<string, string>>;

export const mergeTemplateLayers = (template: TemplateId): Map<string, string> => {
  const out = new Map<string, string>();
  for (const layer of TEMPLATE_LAYER_STACKS[template]) {
    const chunk = embedded[layer];
    if (chunk === undefined) {
      continue;
    }
    for (const [key, val] of chunk) {
      out.set(key, val);
    }
  }
  return out;
};

export const listKeysForTemplate = (template: TemplateId): string[] =>
  [...mergeTemplateLayers(template).keys()].toSorted((a, b) => a.localeCompare(b));
