import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Release } from "@/components/changelog";
import { getChangelog, getRelease, getReleaseSummary } from "@/lib/changelog";

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

  return <Release release={release} />;
};

export default ReleasePage;
