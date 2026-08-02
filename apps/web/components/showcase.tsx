import { AstroIcon } from "@vernostudio/design-system/components/icons/astro";
import { TanStackIcon } from "@vernostudio/design-system/components/icons/tanstack";
import { ViteIcon } from "@vernostudio/design-system/components/icons/vite";
import { NextJsIcon } from "@vernostudio/design-system/components/icons/nextjs";
import Image from "next/image";
import { ChevronRightIcon } from "@vernostudio/design-system/components/icons/chevron-right";

const showcase = [
  {
    name: "Boriphat Jariyatatkone",
    stack: { icon: AstroIcon, label: "Astro" },
    url: "https://boriphat-site.netlify.app",
  },
  {
    name: "Rapeepan Yuenyong",
    stack: { icon: TanStackIcon, label: "TanStack Start" },
    url: "https://rapeepan-site.netlify.app",
  },
  {
    name: "Natthaphong Phongjarumanee",
    stack: { icon: ViteIcon, label: "Vite" },
    url: "https://natthaphong-site.netlify.app",
  },
  {
    name: "Teachin Pongmanee",
    stack: { icon: NextJsIcon, label: "Next.js" },
    url: "https://teachin-pongmanee.netlify.app",
  },
];

export const Showcase = () => (
  <section className="flex flex-col gap-4">
    <h2 className="font-medium text-gray-1000">Showcase</h2>
    <div className="grid gap-4 sm:grid-cols-2">
      {showcase.map(({ name, url, stack }) => (
        <a
          aria-label={`Visit ${name}'s site`}
          className="group flex items-center justify-center overflow-hidden rounded-2xl p-1 shadow-(--ds-shadow-border) transition-shadow duration-200 ease-out hover:shadow-(--ds-shadow-border-medium)"
          href={url}
          key={name}
          rel="noreferrer"
          target="_blank"
        >
          <div className="relative flex w-full flex-col items-center justify-center overflow-hidden material-large">
            <div className="relative aspect-192/100 w-full">
              <Image
                alt={`Preview of ${name}'s showcase site`}
                className="object-cover object-top"
                fill
                sizes="(min-width: 640px) 320px, 100vw"
                src={`${url}/preview.png`}
              />
            </div>
            <div className="flex w-full flex-col items-start justify-center px-4 pt-3 pb-4 font-medium">
              <span className="flex w-full items-center justify-between gap-1">
                <span className="flex-1">{name}</span>
                <span className="-translate-x-0.5 flex shrink-0 scale-75 items-center justify-center text-gray-1000 opacity-0 transition-[opacity,translate,scale] duration-300 ease-out group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100">
                  <ChevronRightIcon className="size-4.5" />
                </span>
              </span>
              <span className="font-normal text-gray-900">
                Built with{" "}
                <span className="whitespace-nowrap">
                  <stack.icon className="mr-1 mb-0.5 inline-block size-4" />
                  {stack.label}
                </span>
                .
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  </section>
);
