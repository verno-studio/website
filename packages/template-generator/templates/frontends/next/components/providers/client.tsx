"use client";

import type { FC, ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export const DesignSystemProvider: FC<{ readonly children: ReactNode }> = ({ children }) => (
  <>
    <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
      {children}
    </ThemeProvider>
    <Toaster />
  </>
);
