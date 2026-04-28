import { ArrowUpRightIcon } from "lucide-react";
import { ExternalLink } from "../external-link";
import { Nextjs, Turborepo } from "./logo";

export const Story = () => (
  <article className="grid max-w-2xl gap-6 text-pretty text-sm text-muted-foreground sm:text-base">
    <p>
      Today, starters and agents can do in minutes what used to take days. But the surface is
      shallow. The faster the scaffold appears, the wider the gap grows. Nothing ships taste at the
      speed the tools ship code.
    </p>

    <p>
      <span className="text-foreground">We are building Verno Studio</span> to close that gap: a
      monorepo and a shared design system, tuned so experience and design engineering are not an
      afterthought—they are the default path.
    </p>

    <p>
      It sits on{" "}
      <ExternalLink href="https://turborepo.dev/">
        <Turborepo aria-hidden className="mr-1 inline-block size-3 align-baseline" />
        Turborepo
      </ExternalLink>
      ,{" "}
      <ExternalLink href="https://nextjs.org/">
        <Nextjs aria-hidden className="mr-1 inline-block size-3 align-baseline" />
        Next.js
      </ExternalLink>
      , and TypeScript, with a real{" "}
      <code className="text-foreground font-mono text-sm bg-muted px-1">
        @vernostudio/design-system
      </code>{" "}
      you can fork, extend, and keep coherent as the product grows.
    </p>

    <p>
      Built by{" "}
      <ExternalLink href="https://www.pungrumpy.com">
        Noppakorn Kaewsalabnil
        <ArrowUpRightIcon aria-hidden className="ml-1 inline-block size-3 align-baseline" />
      </ExternalLink>
      , with a background in design engineering, developer experience, and the kind of work that
      only shows up when a team refuses to treat polish as a phase.
    </p>

    <p>
      We have spent years on patterns, system thinking, and the invisible line between “it works”
      and “it feels true.” Now we are turning that into Verno—so the template is the product, and
      your first commit starts closer to something you are proud to ship.
    </p>
  </article>
);
