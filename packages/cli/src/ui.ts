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

const allowColorBanner = (plainOutput: boolean): boolean => {
  if (plainOutput) {
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

export const renderVernoTitle = (plainOutput: boolean): void => {
  if (!allowColorBanner(plainOutput)) {
    return;
  }
  const terminalWidth = process.stdout.columns ?? 80;
  if (terminalWidth < vernoBannerWidth()) {
    process.stdout.write(`${brandColor(VERNO_TITLE_SIMPLE)}\n`);
    return;
  }
  process.stdout.write(`${brandColor(VERNO_BANNER)}\n`);
};

export const formatVernoBanner = (plainOutput: boolean): string => {
  if (!allowColorBanner(plainOutput)) {
    return "verno";
  }
  return `${TRUECOLOR_BANNER_PREFIX}${VERNO_BANNER}${SGR_RESET}`;
};

export const dimPath = (path: string, plainOutput: boolean): string => {
  if (plainOutput) {
    return path;
  }
  return pc.dim(path);
};
