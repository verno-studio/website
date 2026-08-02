import type { ReactNode } from "react";

import type { RegistryItem } from "@/lib/registry-schema";

// Previews render from the built JSON, not from this app's stylesheet. A swatch
// painted with `bg-gray-500` would show apps/web's Geist layer — the site's
// palette, not the one the registry ships — and the two are free to drift.
// Reading the values back out of the item is the only way the preview is a
// preview.
//
// The raw steps, not the contract names: `--background` is `var(--background-100)`,
// which resolves against a stylesheet that is not loaded here. These are literal
// colors in both modes.
const SWATCH_STEPS = [
  "background-100",
  "gray-100",
  "gray-300",
  "gray-500",
  "gray-700",
  "gray-900",
  "gray-1000",
] as const;

const themeVars = (item: RegistryItem) => {
  const { light, dark } = item.cssVars ?? {};
  return light && dark ? { dark, light } : null;
};

interface RampProps {
  readonly label: string;
  readonly vars: Record<string, string>;
}

const Ramp = ({ label, vars }: RampProps) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-gray-900 text-xs">{label}</span>
    <div className="flex overflow-hidden rounded-md shadow-(--ds-shadow-border)">
      {SWATCH_STEPS.map((step) => (
        <div className="size-10 shrink-0" key={step} style={{ background: vars[step] }} />
      ))}
    </div>
  </div>
);

const themePreview = (item: RegistryItem): ReactNode => {
  const vars = themeVars(item);
  if (!vars) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Ramp label="Light" vars={vars.light} />
      <Ramp label="Dark" vars={vars.dark} />
    </div>
  );
};

// Keyed by registry item name and resolved at build time. Deliberately a literal
// map rather than a dynamic import of the item's own source: a docs page that
// evaluates strings from a JSON file is a code path nobody wants to audit.
// An item with no entry here renders its docs and nothing else.
const previews: Record<string, (item: RegistryItem) => ReactNode> = {
  theme: themePreview,
};

export const getPreview = (item: RegistryItem): ReactNode => previews[item.name]?.(item) ?? null;

// The same steps at thumbnail size, for rows too small to carry the full
// preview. Light only — a row this small cannot label two modes.
const themeThumbnail = (item: RegistryItem): ReactNode => {
  const vars = themeVars(item);
  if (!vars) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col">
      {SWATCH_STEPS.map((step) => (
        <div className="flex-1" key={step} style={{ background: vars.light[step] }} />
      ))}
    </div>
  );
};

// An item with no entry falls back to the generic page glyph.
const thumbnails: Record<string, (item: RegistryItem) => ReactNode> = {
  theme: themeThumbnail,
};

export const getThumbnail = (item: RegistryItem): ReactNode =>
  thumbnails[item.name]?.(item) ?? null;
