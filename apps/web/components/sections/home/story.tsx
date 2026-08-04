import { TurborepoIcon } from "@/components/icons/turborepo";
import { NextJsIcon } from "@/components/icons/nextjs";
import { Installer } from "@/components/installer";

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

    <div className="flex min-w-0 flex-col gap-4">
      <p>
        One command from zero to a Next.js app with Turborepo, workspace packages, shadcn/ui, and
        Ultracite
      </p>
      <Installer command="bunx @vernostudio/cli create" />
    </div>

    <p>
      It sits on{" "}
      <a
        className="text-gray-900 underline decoration-1 decoration-gray-900/50 underline-offset-2 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
        href="https://turborepo.dev/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <TurborepoIcon className="mr-1 mb-0.5 inline-block size-4" />
        Turborepo
      </a>
      ,{" "}
      <a
        className="text-gray-900 underline decoration-1 decoration-gray-900/50 underline-offset-2 transition-[color,text-decoration-color] [@media(hover:hover)_and_(pointer:fine)]:hover:text-gray-1000 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-gray-1000"
        href="https://nextjs.org/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <NextJsIcon className="mr-1 mb-0.5 inline-block size-4" />
        Next.js
      </a>
      , and TypeScript, with a real design system you can fork, extend, and keep coherent as the
      product grows.
    </p>
  </article>
);
