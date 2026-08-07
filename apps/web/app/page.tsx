import { EntryList } from "@/components/entry-list";
import type { EntryListItem } from "@/components/entry-list";
import { Footer } from "@/components/sections/home/footer";
import { Header } from "@/components/sections/home/header";
import { getThumbnail } from "@/components/registry/thumbnails";
import { releaseToEntry } from "@/components/release-entry";
import { Showcase } from "@/components/sections/home/showcase";
import { Story } from "@/components/sections/home/story";
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
    .map((release) => releaseToEntry(getReleaseSummary(release)));

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
