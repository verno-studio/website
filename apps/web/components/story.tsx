import { ExternalLink } from "./external-link";
import { Installer } from "./installer";

export const Story = () => (
  <article className="grid max-w-2xl gap-6 text-pretty text-sm text-muted-foreground sm:text-base">
    <p>
      Today, starters can do in minutes what used to take days. But the surface is shallow. Nothing
      ships taste at the speed tools ship code.
    </p>

    <p>
      <span className="text-foreground">I built Verno Studio</span> to close that gap. It is a
      monorepo and a shared design system, tuned so experience and design engineering are the
      default path, not an afterthought.
    </p>

    <div className="flex flex-col gap-4">
      <p>
        One command from zero to a Next.js app with Turborepo, workspace packages, shadcn/ui, and
        Ultracite:
      </p>
      <Installer command="bun x @vernostudio/cli create" />
    </div>

    <p>
      It sits on <ExternalLink href="https://turborepo.dev/">Turborepo</ExternalLink>,{" "}
      <ExternalLink href="https://nextjs.org/">Next.js</ExternalLink>, and TypeScript, with a real
      design system you can fork, extend, and keep coherent as the product grows.
    </p>

    <p>
      Built by <ExternalLink href="https://www.pungrumpy.com">Noppakorn Kaewsalabnil</ExternalLink>,
      focusing on the invisible details that make software feel great. The template is the product.
    </p>
  </article>
);
