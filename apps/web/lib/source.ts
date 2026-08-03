import { loader } from "fumadocs-core/source";

import { components } from "collections/server";

export const componentDocs = loader({
  baseUrl: "/components",
  source: components.toFumadocsSource(),
});
