/**
 * React bindings for the editor store.
 *
 * The store itself is framework-free; this module is the only adapter between
 * it and React, and the only place that knows about `useSyncExternalStore`.
 */

import { createContext, useContext, useSyncExternalStore } from 'react';

import type { EditorState, EditorStore } from '../application/editorStore.js';
import type { MeasureText } from '../domain/textLayout.js';

export const StoreContext = createContext<EditorStore | null>(null);
export const MeasureContext = createContext<MeasureText | null>(null);

export const useStore = (): EditorStore => {
  const store = useContext(StoreContext);
  if (!store) throw new Error('StoreContext 없이 사용되었습니다.');
  return store;
};

export const useEditorState = (): EditorState => {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
};

export const useMeasure = (): MeasureText => {
  const measure = useContext(MeasureContext);
  if (!measure) throw new Error('MeasureContext 없이 사용되었습니다.');
  return measure;
};
