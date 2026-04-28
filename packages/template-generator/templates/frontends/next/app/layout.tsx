import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "{{projectName}}";

export const metadata: Metadata = { description: "Next.js app", title };

const RootLayout = ({ children }: { readonly children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body className="antialiased min-h-dvh">{children}</body>
  </html>
);

export default RootLayout;
