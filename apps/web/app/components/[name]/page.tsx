import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Navigation } from "@/components/navigation";
import { Pagination } from "@/components/pagination";
import { registryComponents } from "@/components/registry/mdx-components";
import { GeneratedDoc } from "@/components/registry/sections";
import { TableOfContents } from "@/components/table-of-contents";
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

  // The title is a heading like any other, and the prose under it is a section
  // with no other entry. Without it the map starts one section late and the
  // opening paragraphs light up whatever heading follows them.
  const toc = doc
    ? [{ depth: 1, title: item.title ?? item.name, url: `#${item.name}` }, ...doc.data.toc]
    : [];

  return (
    <>
      {/* One entry is a label, not a map. Below two it earns nothing. */}
      {toc.length > 2 ? <TableOfContents items={toc} /> : null}
      <Navigation href="/components" label="Back to components" />
      <article>
        <h1 className="mb-2 scroll-mt-20 font-medium text-gray-1000" id={item.name}>
          {item.title ?? item.name}
        </h1>
        {item.description ? (
          <p className="mb-12 text-gray-900 text-pretty">{item.description}</p>
        ) : null}
        {Prose ? <Prose components={registryComponents(item)} /> : <GeneratedDoc item={item} />}
      </article>
      <Pagination {...getRegistrySiblings(item.name)} />
    </>
  );
};

export default ComponentPage;
