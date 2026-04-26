import { createConsola } from "consola";
import pc from "picocolors";

export interface HumanLogger {
  error: (msg: string) => void;
  info: (msg: string) => void;
  start: (msg: string) => void;
  success: (msg: string) => void;
  warn: (msg: string) => void;
}

const ignoreHumanLog = (msg: string): void => {
  void msg;
};

const createNoopLogger = (): HumanLogger => ({
  error: ignoreHumanLog,
  info: ignoreHumanLog,
  start: ignoreHumanLog,
  success: ignoreHumanLog,
  warn: ignoreHumanLog,
});

export const getLogger = (jsonMode: boolean): HumanLogger => {
  if (jsonMode) {
    return createNoopLogger();
  }
  const consola = createConsola({ level: 3 });
  return {
    error: (msg: string) => {
      consola.error(pc.red(msg));
    },
    info: (msg: string) => {
      consola.info(msg);
    },
    start: (msg: string) => {
      consola.start(msg);
    },
    success: (msg: string) => {
      consola.success(msg);
    },
    warn: (msg: string) => {
      consola.warn(pc.yellow(msg));
    },
  };
};
