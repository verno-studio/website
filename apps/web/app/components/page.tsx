import type { Metadata } from "next";

import { Installer } from "@/components/installer";
import { RegistryIndex } from "@/components/registry-index";
import { getRegistryItemSummary, getRegistryItems } from "@/lib/registry";

export const metadata: Metadata = {
  alternates: { canonical: "/components" },
  description:
    "The Verno Studio component registry — install any of it into your own project with the shadcn CLI.",
  openGraph: { url: "/components" },
  title: "Components",
};

const ComponentsPage = () => {
  const items = getRegistryItems().map(getRegistryItemSummary);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="font-medium text-gray-1000">Components</h1>
        <p className="text-gray-900 text-pretty">
          The parts of this design system that are meant to be shared, published as a shadcn
          registry. Install the source into your project and own it from there — start with the
          theme, which every other item is built against:
        </p>
        <Installer command="bunx shadcn@latest add https://verno-studio.vercel.app/r/theme.json" />
      </section>

      <RegistryIndex items={items} />
    </>
  );
};

export default ComponentsPage;
