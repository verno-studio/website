export const packageJsonString = (data: Record<string, unknown>): string =>
  `${JSON.stringify(data, null, 2)}\n`;
