import pc from "picocolors";

export const VERNO_TITLE_SIMPLE = "Verno Studio";

const VERNO_BANNER = `
██╗   ██╗███████╗██████╗ ███╗   ██╗ ██████╗    ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
██║   ██║██╔════╝██╔══██╗████╗  ██║██╔═══██╗   ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
██║   ██║█████╗  ██████╔╝██╔██╗ ██║██║   ██║   ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
╚██╗ ██╔╝██╔══╝  ██╔══██╗██║╚██╗██║██║   ██║   ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
 ╚████╔╝ ███████╗██║  ██║██║ ╚████║╚██████╔╝██╗███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝ 
                                                                                             `;

const TRUECOLOR_BANNER_PREFIX = "\u001B[38;2;255;81;20m";
const SGR_RESET = "\u001B[0m";

const allowColorBanner = (jsonMode: boolean): boolean => {
  if (jsonMode) {
    return false;
  }
  if (process.env.NO_COLOR) {
    return false;
  }
  return process.stdout.isTTY === true;
};

const brandColor = (text: string): string => `${TRUECOLOR_BANNER_PREFIX}${text}${SGR_RESET}`;

const vernoBannerWidth = (): number => {
  const titleLines = VERNO_BANNER.split("\n");
  return Math.max(...titleLines.map((line) => line.length));
};

export const renderVernoTitle = (jsonMode: boolean): void => {
  if (!allowColorBanner(jsonMode)) {
    return;
  }
  const terminalWidth = process.stdout.columns ?? 80;
  if (terminalWidth < vernoBannerWidth()) {
    process.stdout.write(`${brandColor(VERNO_TITLE_SIMPLE)}\n`);
    return;
  }
  process.stdout.write(`${brandColor(VERNO_BANNER)}\n`);
};

export const formatVernoBanner = (jsonMode: boolean): string => {
  if (!allowColorBanner(jsonMode)) {
    return "verno";
  }
  return `${TRUECOLOR_BANNER_PREFIX}${VERNO_BANNER}${SGR_RESET}`;
};

export const dimPath = (path: string, jsonMode: boolean): string => {
  if (jsonMode) {
    return path;
  }
  return pc.dim(path);
};
