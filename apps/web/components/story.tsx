import { TurborepoIcon } from "@vernostudio/design-system/components/icons/turborepo";
import { NextJsIcon } from "@vernostudio/design-system/components/icons/nextjs";
import { ProseLink } from "@vernostudio/design-system/components/prose-link";
import { Installer } from "./installer";

export const Story = () => (
  <article className="grid gap-6 [&_p]:text-pretty [&_p]:text-gray-900">
    <p>
      Today, starters can do in minutes what used to take days. But the surface is shallow. Nothing
      ships taste at the speed tools ship code.
    </p>

    <p>
      <span className="text-gray-1000 font-serif">I built Verno Studio</span> to close that gap. It
      is a monorepo and a shared design system, tuned so experience and design engineering are the
      default path, not an afterthought.
    </p>

    <div className="flex flex-col gap-4">
      <p>
        One command from zero to a Next.js app with Turborepo, workspace packages, shadcn/ui, and
        Ultracite
      </p>
      <Installer command="bunx @vernostudio/cli create" />
    </div>

    <p>
      It sits on{" "}
      <ProseLink href="https://turborepo.dev/">
        <TurborepoIcon className="mr-1 mb-0.5 inline-block size-4" />
        Turborepo
      </ProseLink>
      ,{" "}
      <ProseLink href="https://nextjs.org/">
        <NextJsIcon className="mr-1 mb-0.5 inline-block size-4" />
        Next.js
      </ProseLink>
      , and TypeScript, with a real design system you can fork, extend, and keep coherent as the
      product grows.
    </p>
  </article>
);
