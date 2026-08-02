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
          Every component on this site is published as a shadcn registry, so you can install the
          source into your project and own it from there. Point the CLI at the registry once:
        </p>
        <Installer command="bunx shadcn@latest add https://verno-studio.vercel.app/r/theme.json" />
      </section>

      <RegistryIndex items={items} />
    </>
  );
};

export default ComponentsPage;
