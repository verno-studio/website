import { EntryList } from "@/components/entry-list";
import type { EntryListItem } from "@/components/entry-list";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getThumbnail } from "@/components/registry/thumbnails";
import { Showcase } from "@/components/showcase";
import { Story } from "@/components/story";
import { getChangelog, getReleaseSummary } from "@/lib/changelog";
import { getRegistryItems } from "@/lib/registry";

export const metadata = {
  alternates: { canonical: "/" },
  description:
    "A Next.js monorepo template for DX, UI systems, and design engineering. Ship with taste.",
  openGraph: { url: "/" },
  title: "Verno Studio",
};

const LATEST_UPDATES = 3;

const Home = () => {
  const components: EntryListItem[] = getRegistryItems().map((item) => ({
    description: item.description ?? "",
    href: `/components/${item.name}`,
    preview: getThumbnail(item),
    title: item.title ?? item.name,
  }));

  const updates: EntryListItem[] = getChangelog()
    .slice(0, LATEST_UPDATES)
    .map((release) => {
      const { slug, version, headline, itemCount } = getReleaseSummary(release);

      return {
        description: headline || `${itemCount} ${itemCount === 1 ? "change" : "changes"}`,
        href: `/updates/${slug}`,
        title: <span className="font-mono">v{version}</span>,
      };
    });

  return (
    <>
      <Header />
      <Story />
      <Showcase />
      <EntryList href="/components" items={components} title="Components" />
      <EntryList href="/updates" items={updates} title="Updates" />
      <Footer />
    </>
  );
};

export default Home;
