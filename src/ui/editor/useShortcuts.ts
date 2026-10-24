/**
 * Keyboard shortcuts.
 *
 * Every binding maps to a store command that the UI also exposes as a button,
 * so a shortcut can never do something unreachable. Keys are ignored while a
 * text field has focus: typing in the inspector must not delete a layer.
 */

import { useEffect } from 'react';

import type { EditorStore } from '../../application/editorStore.js';

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;

export const useShortcuts = (store: EditorStore): void => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (isTypingTarget(event.target)) return;
      const accel = event.ctrlKey || event.metaKey;
      const nudge = event.shiftKey ? 10 : 1;

      if (accel) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault();
            if (event.shiftKey) store.redo();
            else store.undo();
            return;
          case 'y':
            event.preventDefault();
            store.redo();
            return;
          case 'c':
            store.copySelection();
            return;
          case 'x':
            store.cutSelection();
            return;
          case 'v':
            store.paste();
            return;
          case 'd':
            event.preventDefault();
            store.duplicateSelection();
            return;
          case 'a':
            event.preventDefault();
            store.selectAll();
            return;
          case 'g':
            event.preventDefault();
            if (event.shiftKey) store.ungroup();
            else store.group();
            return;
          case '0':
            event.preventDefault();
            store.resetView(1);
            return;
          case '=':
          case '+':
            event.preventDefault();
            store.zoomBy(1.2);
            return;
          case '-':
            event.preventDefault();
            store.zoomBy(1 / 1.2);
            return;
          case ']':
            event.preventDefault();
            store.reorderSelection(event.shiftKey ? 'front' : 'forward');
            return;
          case '[':
            event.preventDefault();
            store.reorderSelection(event.shiftKey ? 'back' : 'backward');
            return;
          default:
            return;
        }
      }

      switch (event.key) {
        case 'Delete':
        case 'Backspace':
          event.preventDefault();
          store.removeSelection();
          return;
        case 'Escape':
          store.clearSelection();
          return;
        case 'ArrowLeft':
          event.preventDefault();
          store.moveSelectionBy(-nudge, 0, { coalesce: 'nudge' });
          return;
        case 'ArrowRight':
          event.preventDefault();
          store.moveSelectionBy(nudge, 0, { coalesce: 'nudge' });
          return;
        case 'ArrowUp':
          event.preventDefault();
          store.moveSelectionBy(0, -nudge, { coalesce: 'nudge' });
          return;
        case 'ArrowDown':
          event.preventDefault();
          store.moveSelectionBy(0, nudge, { coalesce: 'nudge' });
          return;
        default:
          return;
      }
    };

    globalThis.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.removeEventListener('keydown', onKeyDown);
    };
  }, [store]);
};
