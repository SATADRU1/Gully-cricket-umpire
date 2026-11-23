// crypto.randomUUID only works on https/localhost, so use a simple id that works everywhere
export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
