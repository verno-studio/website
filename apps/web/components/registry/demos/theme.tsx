import { getRegistryItem } from "@/lib/registry";

const GRAY_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;

const ACCENTS = ["blue", "red", "purple", "teal", "amber", "pink"] as const;

const themeVars = () => {
  const { light, dark } = getRegistryItem("theme")?.cssVars ?? {};
  return light && dark ? { dark, light } : null;
};

const OKLCH_LIGHTNESS = /oklch\(\s*(?<value>[\d.]+)(?<percent>%?)/u;

const INK_BOUNDARY = 0.73;

const inkFor = (value: string, vars: Record<string, string>) => {
  const groups = OKLCH_LIGHTNESS.exec(value)?.groups;

  if (!groups) {
    return vars["gray-1000"];
  }

  // Both spellings ship: the grays are written `oklch(0.961 0 0)` and the
  // accents `oklch(57.61% 0.2508 258.23)`.
  const lightness = groups.percent ? Number(groups.value) / 100 : Number(groups.value);

  return lightness > INK_BOUNDARY ? vars["gray-1000"] : vars["background-100"];
};

interface RampProps {
  readonly label: string;
  readonly vars: Record<string, string>;
}

const Ramp = ({ label, vars }: RampProps) => (
  <div className="flex w-full flex-col items-center gap-2">
    <span className="flex h-10 w-24 select-none items-center justify-center rounded-full bg-gray-100 font-mono uppercase text-gray-1000 shadow-(--ds-shadow-border) @lg:hidden">
      {label}
    </span>
    <div className="flex items-center gap-1 rounded-2xl p-1 shadow-(--ds-shadow-border) @md:rounded-full">
      <span className="hidden h-10 w-24 shrink-0 select-none items-center justify-center rounded-full bg-gray-100 font-mono uppercase text-gray-1000 shadow-(--ds-shadow-border) @lg:flex">
        {label}
      </span>
      <div className="grid grid-cols-5 gap-1 @md:grid-cols-10">
        {GRAY_STEPS.map((step) => {
          const value = vars[`gray-${step}`];

          return (
            <div
              className="size-10 rounded-full shadow-(--ds-shadow-border)"
              key={step}
              style={{ background: value }}
              title={`--gray-${step}: ${value}`}
            />
          );
        })}
      </div>
    </div>
  </div>
);

export const ColorScale = () => {
  const vars = themeVars();

  if (!vars) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <Ramp label="light" vars={vars.light} />
      <Ramp label="dark" vars={vars.dark} />
    </div>
  );
};

export const AccentScale = () => {
  const vars = themeVars();

  if (!vars) {
    return null;
  }

  return (
    <div className="grid w-full grid-cols-3 justify-items-center gap-3">
      {ACCENTS.map((accent) => {
        const value = vars.light[`${accent}-700`];

        return (
          <div
            className="w-full max-w-26 select-none rounded-full bg-background-200 p-1 shadow-(--ds-shadow-border)"
            key={accent}
          >
            <div
              className="flex h-8 w-full items-center justify-center rounded-full shadow-(--ds-shadow-border)"
              style={{ background: value }}
              title={`--${accent}-700: ${value}`}
            >
              <span className="font-mono" style={{ color: inkFor(value, vars.light) }}>
                {accent}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
