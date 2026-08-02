import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";

import { Installer } from "@/components/installer";
import { getPreview } from "@/components/registry/previews";
import {
  getRegistryItem,
  getRegistryItems,
  installCommand,
  installUrlCommand,
} from "@/lib/registry";

interface ComponentPageProps {
  params: Promise<{ name: string }>;
}

export const generateStaticParams = () => getRegistryItems().map(({ name }) => ({ name }));

export const generateMetadata = async ({ params }: ComponentPageProps): Promise<Metadata> => {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    return {};
  }

  return {
    alternates: { canonical: `/components/${item.name}` },
    description: item.description ?? `The ${item.name} item from the Verno Studio registry.`,
    openGraph: { url: `/components/${item.name}` },
    title: item.title ?? item.name,
  };
};

const ComponentPage = async ({ params }: ComponentPageProps) => {
  const { name } = await params;
  const item = getRegistryItem(name);

  if (!item) {
    notFound();
  }

  const preview = getPreview(item.name);
  const dependencies = item.dependencies ?? [];
  // The light block is the source of truth; dark redeclares the same names.
  const tokens = Object.entries(item.cssVars?.light ?? {});

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="font-medium text-gray-1000">{item.title ?? item.name}</h1>
        {item.description ? <p className="text-gray-900 text-pretty">{item.description}</p> : null}
        {item.docs ? <p className="text-gray-900 text-pretty">{item.docs}</p> : null}
      </section>

      {preview ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-gray-1000">Preview</h2>
          <div className="flex min-h-32 items-center justify-center material-large px-4 py-8">
            {preview}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-medium text-gray-1000">Install</h2>
        <Installer command={installCommand(item.name)} />
        <p className="text-gray-900">
          Or without configuring the registry namespace in <code>components.json</code>:
        </p>
        <Installer command={installUrlCommand(item.name)} />
      </section>

      {dependencies.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-gray-1000">Dependencies</h2>
          <ul>
            {dependencies.map((dependency) => (
              <li key={dependency}>
                <code>{dependency}</code>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tokens.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-medium text-gray-1000">Tokens</h2>
          <p className="text-gray-900">
            {tokens.length} variables land in your stylesheet. Dark mode redeclares the same names,
            so nothing downstream has to know which mode it is in.
          </p>
          <dl className="grid max-h-96 grid-cols-[auto_1fr] gap-x-4 gap-y-1 overflow-y-auto material-large px-4 py-4 font-mono text-sm">
            {tokens.map(([name, value]) => (
              <Fragment key={name}>
                <dt className="text-gray-1000">--{name}</dt>
                <dd className="truncate text-gray-900">{value}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
      ) : null}

      {item.files.map((file) => (
        <section className="flex flex-col gap-3" key={file.path}>
          <h2 className="font-mono text-gray-1000 text-sm">{file.path}</h2>
          <pre className="overflow-x-auto material-large px-4 py-4 text-gray-900 text-sm leading-relaxed">
            <code>{file.content}</code>
          </pre>
        </section>
      ))}
    </>
  );
};

export default ComponentPage;
