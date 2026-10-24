/** Identity values. Opaque to consumers: never parsed for meaning or order. */

let counter = 0;

const randomPart = (): string => {
  const globalCrypto = typeof crypto === 'undefined' ? undefined : crypto;
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(6);
    globalCrypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(16).slice(2, 14);
};

/** A fresh identifier, unique within a session and stable once stored. */
export const createId = (prefix: string): string => {
  counter += 1;
  return `${prefix}_${randomPart()}${counter.toString(36)}`;
};
