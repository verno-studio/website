import type { Metadata } from "next";

import { Navigation } from "@/components/navigation";
import { UpdatesIndex } from "@/components/updates-index";
import { getChangelog, getReleaseSummary } from "@/lib/changelog";

export const metadata: Metadata = {
  alternates: { canonical: "/updates" },
  description:
    "Release notes for Verno Studio. Every published version, parsed straight from the changelog.",
  openGraph: { url: "/updates" },
  title: "Updates",
};

const UpdatesPage = () => {
  const releases = getChangelog().map(getReleaseSummary);

  return (
    <>
      <Navigation />
      <section className="flex flex-col gap-4">
        <h1 className="font-medium text-gray-1000">Updates</h1>
        <p className="text-gray-900 text-pretty">
          Every published version, parsed straight from the changelog. Nothing here is written by
          hand. A release note is whatever shipped with the release.
        </p>
      </section>

      <UpdatesIndex releases={releases} />
    </>
  );
};

export default UpdatesPage;
