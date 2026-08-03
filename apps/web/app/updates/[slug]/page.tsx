import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Release } from "@/components/changelog";
import { Navigation } from "@/components/navigation";
import { Pagination } from "@/components/pagination";
import { getChangelog, getRelease, getReleaseSiblings, getReleaseSummary } from "@/lib/changelog";

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = () => getChangelog().map(({ slug }) => ({ slug }));

export const generateMetadata = async ({ params }: ReleasePageProps): Promise<Metadata> => {
  const { slug } = await params;
  const release = getRelease(slug);

  if (!release) {
    return {};
  }

  const { headline } = getReleaseSummary(release);
  const description = headline.length > 200 ? `${headline.slice(0, 197)}...` : headline;

  return {
    alternates: { canonical: `/updates/${release.slug}` },
    description: description || `Release notes for Verno Studio v${release.version}.`,
    openGraph: { url: `/updates/${release.slug}` },
    title: `v${release.version}`,
  };
};

const ReleasePage = async ({ params }: ReleasePageProps) => {
  const { slug } = await params;
  const release = getRelease(slug);

  if (!release) {
    notFound();
  }

  return (
    <>
      <Navigation href="/updates" label="Back to updates" />
      <section className="grid gap-4">
        <h1 className="font-medium text-gray-1000">v{release.version}</h1>
      </section>
      <Release release={release} />
      <Pagination {...getReleaseSiblings(release.slug)} />
    </>
  );
};

export default ReleasePage;
