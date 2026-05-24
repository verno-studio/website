import "./globals.css";
import { fonts } from "@vernostudio/design-system/lib/fonts";
import { DesignSystemProvider } from "@vernostudio/design-system/components/providers/client";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { url } from "@/lib/url";
import { Header } from "@/components/header";

const title = "Verno Studio";
const description =
  "A Next.js monorepo template for DX, UI systems, and design engineering. Ship with taste.";

export const metadata: Metadata = {
  alternates: {
    canonical: url,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title,
  },
  authors: [
    {
      name: "Noppakorn Kaewsalabnil",
      url: "https://www.pungrumpy.com",
    },
  ],
  creator: "Verno Studio",
  description,
  metadataBase: new URL(url),
  openGraph: {
    description,
    images: [
      {
        alt: "Verno Studio",
        height: 630,
        url: new URL("/opengraph-image.gif", url).toString(),
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: "Verno Studio",
    title,
    type: "website",
    url,
  },
  title,
  twitter: {
    card: "summary_large_image",
    creatorId: "@vernostudio",
    description,
    images: [
      {
        alt: "Verno Studio",
        height: 630,
        url: new URL("/opengraph-image.gif", url).toString(),
        width: 1200,
      },
    ],
    title,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  author: { "@type": "Person", name: "Noppakorn Kaewsalabnil" },
  codeRepository: "https://github.com/verno-studio/website",
  description,
  license: "https://opensource.org/licenses/MIT",
  name: "Verno Studio",
  programmingLanguage: "TypeScript",
  url,
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </head>
    <body className={fonts}>
      <DesignSystemProvider>
        <main className="relative z-10 mx-auto grid w-full max-w-2xl gap-16 sm:gap-24 px-4 py-16 sm:py-32">
          <Header />
          <div className="flex flex-1 flex-col gap-12">{children}</div>
        </main>
      </DesignSystemProvider>
    </body>
  </html>
);

export default RootLayout;
