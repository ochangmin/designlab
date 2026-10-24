/**
 * The session's uploaded images.
 *
 * Uploads live for the lifetime of the tab and are deliberately not persisted:
 * a data URL copy already travels inside the document that uses it, and
 * mirroring every upload into local storage would exhaust the quota for no
 * added capability. Reopening a saved design still shows its images.
 */

import type { ImportedImage } from './assets.js';

export interface LibraryEntry extends ImportedImage {
  readonly id: string;
  readonly addedAt: number;
}

let entries: readonly LibraryEntry[] = [];
const listeners = new Set<() => void>();

export const assetLibrary = {
  list: (): readonly LibraryEntry[] => entries,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  add: (image: ImportedImage): LibraryEntry => {
    const entry: LibraryEntry = { ...image, id: `asset_${entries.length}_${Date.now()}`, addedAt: Date.now() };
    entries = [entry, ...entries];
    for (const listener of listeners) listener();
    return entry;
  },

  remove: (id: string): void => {
    entries = entries.filter((entry) => entry.id !== id);
    for (const listener of listeners) listener();
  },
};
