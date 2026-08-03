import { highlight } from "fumadocs-core/highlight";
import { Fragment } from "react";
import type { ComponentProps } from "react";

import { Installer } from "@/components/installer";
import { CodeSurface } from "@/components/registry/code-surface";
import { codeThemes, languageOf } from "@/lib/code-theme";
import { installCommand, installUrlCommand } from "@/lib/registry";
import type { RegistryItem } from "@/lib/registry-schema";

interface ItemProps {
  readonly item: RegistryItem;
}

export const Install = ({ item }: ItemProps) => <Installer command={installCommand(item.name)} />;

export const InstallUrl = ({ item }: ItemProps) => (
  <Installer command={installUrlCommand(item.name)} />
);

export const Dependencies = ({ item }: ItemProps) => {
  const dependencies = item.dependencies ?? [];

  if (dependencies.length === 0) {
    return null;
  }

  return (
    <ul className="my-6 flex list-none flex-row flex-wrap gap-2 pl-0">
      {dependencies.map((dependency) => (
        <li key={dependency}>
          <code className="rounded-full bg-background-100 px-3 py-1 text-gray-1000 text-sm shadow-(--ds-shadow-border)">
            {dependency}
          </code>
        </li>
      ))}
    </ul>
  );
};

export const Tokens = ({ item }: ItemProps) => {
  const tokens = Object.entries(item.cssVars?.light ?? {});

  if (tokens.length === 0) {
    return null;
  }

  return (
    <div className="my-8 overflow-hidden rounded-xl bg-background-100 shadow-(--ds-shadow-border)">
      <dl className="grid max-h-96 grid-cols-[auto_1fr] gap-x-4 gap-y-1 overflow-y-auto p-4 font-mono text-sm no-scrollbar scroll-fade-b">
        {tokens.map(([token, value]) => (
          <Fragment key={token}>
            <dt className="text-gray-1000">--{token}</dt>
            <dd className="truncate text-gray-900">{value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
};

const surfaceFor = (name: string, lines: number) => ({
  pre: ({ className, style, children }: ComponentProps<"pre">) => (
    <CodeSurface className={className} lines={lines} name={name} style={style}>
      {children}
    </CodeSurface>
  ),
});

export const Source = async ({ item }: ItemProps) => {
  const blocks = await Promise.all(
    item.files.map((file) =>
      highlight(file.content, {
        components: surfaceFor(file.path, file.content.trimEnd().split("\n").length),
        // Without this shiki writes the light theme straight onto `color` and
        // only exposes `--shiki-dark`. The site's stylesheet reads
        // `--shiki-light`, which would then resolve to nothing and drop the
        // whole block back to one inherited gray.
        defaultColor: false,
        lang: languageOf(file.path),
        themes: codeThemes,
      }),
    ),
  );

  return (
    <>
      {blocks.map((block, index) => (
        <Fragment key={item.files[index]?.path}>{block}</Fragment>
      ))}
    </>
  );
};

export const GeneratedDoc = ({ item }: ItemProps) => (
  <>
    <h2 className="mt-16 mb-3 font-medium text-gray-1000">Install</h2>
    <Install item={item} />
    <Dependencies item={item} />
    <Tokens item={item} />
    <Source item={item} />
  </>
);
