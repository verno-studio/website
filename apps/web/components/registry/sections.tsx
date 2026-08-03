import { Fragment } from "react";

import { Installer } from "@/components/installer";
import { CodeSurface } from "@/components/registry/code-surface";
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
      <dl className="grid max-h-96 grid-cols-[auto_1fr] gap-x-4 gap-y-1 overflow-y-auto px-4 py-4 font-mono text-sm no-scrollbar scroll-fade-b">
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

export const Source = ({ item }: ItemProps) => (
  <>
    {item.files.map((file) => (
      <CodeSurface key={file.path} name={file.path}>
        <code>{file.content}</code>
      </CodeSurface>
    ))}
  </>
);

export const GeneratedDoc = ({ item }: ItemProps) => (
  <>
    <h2 className="mt-16 mb-3 font-medium text-gray-1000">Install</h2>
    <Install item={item} />
    <Dependencies item={item} />
    <Tokens item={item} />
    <Source item={item} />
  </>
);
