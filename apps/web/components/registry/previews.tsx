import { CopyButton } from "@vernostudio/design-system/components/copy-button";
import { AstroIcon } from "@vernostudio/design-system/components/icons/astro";
import { CheckIcon } from "@vernostudio/design-system/components/icons/check";
import { ChevronRightIcon } from "@vernostudio/design-system/components/icons/chevron-right";
import { CopyIcon } from "@vernostudio/design-system/components/icons/copy";
import { NextJsIcon } from "@vernostudio/design-system/components/icons/nextjs";
import { PunGrumpyIcon } from "@vernostudio/design-system/components/icons/pungrumpy";
import { TanStackIcon } from "@vernostudio/design-system/components/icons/tanstack";
import { TurborepoIcon } from "@vernostudio/design-system/components/icons/turborepo";
import { ViteIcon } from "@vernostudio/design-system/components/icons/vite";
import { ProseLink } from "@vernostudio/design-system/components/prose-link";
import type { ReactNode } from "react";

// Keyed by registry item name and resolved at build time. Deliberately a literal
// map rather than a dynamic import of the item's own source: a docs page that
// evaluates strings from a JSON file is a code path nobody wants to audit, and
// the registry is small enough that listing previews by hand stays honest.
// An item with no entry here renders its source and nothing else.
const previews: Record<string, ReactNode> = {
  "copy-button": <CopyButton value="bunx @vernostudio/cli create" />,
  icons: (
    <div className="flex flex-wrap items-center gap-5 text-gray-1000">
      <AstroIcon className="size-5" />
      <NextJsIcon className="size-5" />
      <TanStackIcon className="size-5" />
      <TurborepoIcon className="size-5" />
      <ViteIcon className="size-5" />
      <PunGrumpyIcon className="size-5" />
      <CheckIcon aria-hidden className="size-5" />
      <CopyIcon aria-hidden className="size-5" />
      <ChevronRightIcon className="size-5" />
    </div>
  ),
  "prose-link": (
    <p className="text-gray-900">
      Built on the{" "}
      <ProseLink href="https://ui.shadcn.com/docs/registry">shadcn registry</ProseLink>, so any
      project can install it.
    </p>
  ),
};

export const getPreview = (name: string): ReactNode => previews[name] ?? null;
