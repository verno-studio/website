import { loader } from "fumadocs-core/source";

import { components } from "@/.source";

/**
 * `baseUrl` matches the route these pages already live under. fumadocs is not
 * doing the routing here — `/components/[name]` is driven by the registry, and a
 * slug with no MDX file simply renders without prose.
 */
export const componentDocs = loader({
  baseUrl: "/components",
  source: components.toFumadocsSource(),
});
