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

  return <UpdatesIndex releases={releases} />;
};

export default UpdatesPage;
