"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";

// Depends on nothing but next-themes, which is a real package. Wrapping in
// `TooltipProvider` or rendering a `<Toaster />` here would import
// components/ui files that do not exist until `shadcn add tooltip sonner` has
// run — add them once you have.
export const DesignSystemProvider = ({ children }: PropsWithChildren) => (
  <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
    {children}
  </ThemeProvider>
);
