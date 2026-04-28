"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "../ui/tooltip";
import { Toaster } from "../ui/sonner";
import type { PropsWithChildren } from "react";

export const DesignSystemProvider = ({ children }: PropsWithChildren) => (
  <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
    <TooltipProvider delayDuration={0}>
      {children}
      <Toaster />
    </TooltipProvider>
  </ThemeProvider>
);
