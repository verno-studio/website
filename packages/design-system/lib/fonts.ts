import { cn } from "@verno/design-system/lib/utils";
import { Geist as createSans, Instrument_Serif as createSerif } from "next/font/google";

const sans = createSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const serif = createSerif({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
});

export const fonts = cn(sans.variable, serif.variable, "touch-manipulation font-sans antialiased");
