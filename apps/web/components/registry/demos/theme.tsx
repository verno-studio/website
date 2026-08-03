import { getRegistryItem } from "@/lib/registry";

const GRAY_STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;

const ACCENTS = ["blue", "red", "purple", "teal", "amber", "pink"] as const;

const themeVars = () => {
  const { light, dark } = getRegistryItem("theme")?.cssVars ?? {};
  return light && dark ? { dark, light } : null;
};

interface RampProps {
  readonly label: string;
  readonly vars: Record<string, string>;
}

const Ramp = ({ label, vars }: RampProps) => (
  <div className="flex w-full flex-col gap-2">
    <span className="font-mono text-gray-900 text-xs">{label}</span>
    <div className="flex overflow-hidden rounded-md shadow-(--ds-shadow-border)">
      {GRAY_STEPS.map((step) => (
        <div
          className="h-14 flex-1"
          key={step}
          style={{ background: vars[`gray-${step}`] }}
          title={`--gray-${step}: ${vars[`gray-${step}`]}`}
        />
      ))}
    </div>
    <div className="flex">
      {GRAY_STEPS.map((step) => (
        <span className="flex-1 text-center font-mono text-[10px] text-gray-900" key={step}>
          {step}
        </span>
      ))}
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
    <div className="flex w-full flex-wrap items-start justify-center gap-6">
      {ACCENTS.map((accent) => (
        <div className="flex flex-col items-center gap-2" key={accent}>
          <div
            className="size-12 rounded-full shadow-(--ds-shadow-border)"
            style={{ background: vars.light[`${accent}-700`] }}
            title={`--${accent}-700: ${vars.light[`${accent}-700`]}`}
          />
          <span className="font-mono text-[10px] text-gray-900">{accent}</span>
        </div>
      ))}
    </div>
  );
};
