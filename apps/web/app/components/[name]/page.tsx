import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navigation } from "@/components/navigation";
import { Pager } from "@/components/pager";
import { registryComponents } from "@/components/registry/mdx-components";
import { GeneratedDoc } from "@/components/registry/sections";
import { getRegistryItem, getRegistryItems, getRegistrySiblings } from "@/lib/registry";
import { componentDocs } from "@/lib/source";

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

  const doc = componentDocs.getPage([item.name]);
  const Prose = doc?.data.body;

  return (
    <>
      <Navigation href="/components" label="Back to components" />
      <article>
        <h1 className="mb-2 font-medium text-gray-1000">{item.title ?? item.name}</h1>
        {item.description ? (
          <p className="mb-12 text-gray-900 text-pretty">{item.description}</p>
        ) : null}
        {Prose ? <Prose components={registryComponents(item)} /> : <GeneratedDoc item={item} />}
      </article>
      <Pager {...getRegistrySiblings(item.name)} />
    </>
  );
};

export default ComponentPage;
