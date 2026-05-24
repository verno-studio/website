import type { Metadata } from "next";

import { UpdatesIndex } from "@/components/updates-index";
import { getChangelog, getReleaseSummary } from "@/lib/changelog";

export const metadata: Metadata = {
  alternates: { canonical: "/updates" },
  description:
    "Release notes for Verno Studio — every published version, parsed straight from the changelog.",
  openGraph: { url: "/updates" },
  title: "Updates",
};

const UpdatesPage = () => {
  const releases = getChangelog().map(getReleaseSummary);

  return (
    <>
      <section className="grid gap-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Updates
        </h1>
        <p className="text-muted-foreground text-balance leading-relaxed">
          What shipped in each version of Verno Studio. Pulled straight from the changelog.
        </p>
      </section>
      <UpdatesIndex releases={releases} />
    </>
  );
};

export default UpdatesPage;
