import type { Metadata } from "next";

import { Installer } from "@/components/installer";
import { Navigation } from "@/components/navigation";
import { RegistryIndex } from "@/components/registry-index";
import type { RegistryIndexItem } from "@/components/registry-index";
import { getThumbnail } from "@/components/registry/thumbnails";
import { getRegistryItemSummary, getRegistryItems } from "@/lib/registry";

export const metadata: Metadata = {
  alternates: { canonical: "/components" },
  description:
    "The Verno Studio component registry. Install any of it into your own project with the shadcn CLI.",
  openGraph: { url: "/components" },
  title: "Components",
};

const ComponentsPage = () => {
  const items: RegistryIndexItem[] = getRegistryItems().map((item) => ({
    ...getRegistryItemSummary(item),
    preview: getThumbnail(item),
  }));

  return (
    <>
      <Navigation />
      <section className="flex flex-col gap-4">
        <h1 className="font-medium text-gray-1000">Components</h1>
        <p className="text-gray-900 text-pretty">
          The part of this design system that is meant to travel, published as a shadcn registry.
          The components on this site stay here. What is worth sharing is the palette underneath
          them, and it installs into any shadcn project:
        </p>
        <Installer command="bunx shadcn@latest add https://verno-studio.vercel.app/r/theme.json" />
      </section>

      <RegistryIndex items={items} />
    </>
  );
};

export default ComponentsPage;
