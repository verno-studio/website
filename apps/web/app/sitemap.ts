import type { MetadataRoute } from "next";
import { getChangelog } from "@/lib/changelog";
import { getRegistryItems } from "@/lib/registry";
import { url } from "@/lib/url";

// `lastModified` is deliberately omitted rather than stamped with `new Date()`:
// a value that moves on every build tells crawlers the page changed when it did
// not, and a lastModified they learn to distrust is worse than none.
const sitemap = (): MetadataRoute.Sitemap => [
  {
    changeFrequency: "monthly",
    priority: 1,
    url,
  },
  {
    changeFrequency: "weekly",
    priority: 0.8,
    url: new URL("/updates", url).toString(),
  },
  ...getChangelog().map(({ slug }) => ({
    changeFrequency: "yearly" as const,
    priority: 0.5,
    url: new URL(`/updates/${slug}`, url).toString(),
  })),
  {
    changeFrequency: "weekly",
    priority: 0.8,
    url: new URL("/components", url).toString(),
  },
  ...getRegistryItems().map(({ name }) => ({
    changeFrequency: "monthly" as const,
    priority: 0.5,
    url: new URL(`/components/${name}`, url).toString(),
  })),
];

export default sitemap;
