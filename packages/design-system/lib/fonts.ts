import { cn } from "./utils";
import {
  Geist as createSans,
  Libre_Baskerville as createSerif,
  Geist_Mono as createMono,
} from "next/font/google";

const sans = createSans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-sans",
  weight: "variable",
});

const mono = createMono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "variable",
});

const serif = createSerif({
  display: "swap",
  style: "italic",
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "variable",
});

export const fonts = cn(
  sans.variable,
  mono.variable,
  serif.variable,
  "touch-manipulation font-sans antialiased [font-synthesis-weight:none]",
);
