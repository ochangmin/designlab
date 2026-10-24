/**
 * The application root.
 *
 * It owns exactly two things the rest of the app reads through context: the
 * editor store for the open document, and the text-measurement port. Routing
 * is a single piece of state — the dashboard, or an open design.
 */

import { useMemo, useRef, useState, type ReactElement } from 'react';

import { EditorStore } from '../application/editorStore.js';
import { rememberLastOpened, saveProject } from '../application/projectRepository.js';
import type { Design } from '../domain/document.js';
import { createCanvasMeasure } from '../domain/textLayout.js';
import { Dashboard } from './Dashboard.js';
import { Editor } from './editor/Editor.js';
import { MeasureContext, StoreContext } from './storeContext.js';
import { startViewTransition } from './viewTransition.js';

export const App = (): ReactElement => {
  const measure = useMemo(() => createCanvasMeasure(), []);
  const storeRef = useRef<EditorStore | null>(null);
  const [open, setOpen] = useState<boolean>(false);

  const openDesign = (design: Design): void => {
    // A design reaches the editor only after it exists in storage, so a reload
    // immediately after opening finds it.
    const saved = saveProject(design);
    if (saved.ok) rememberLastOpened(design.id);
    const store = new EditorStore(design);
    // The document is already in storage, so say so rather than showing
    // "not saved" until the first autosave tick confirms what is already true.
    if (saved.ok) store.markSaved();
    else store.reportError(saved.error);
    storeRef.current = store;
    startViewTransition(() => setOpen(true));
  };

  const exitToDashboard = (): void => {
    startViewTransition(() => {
      setOpen(false);
      storeRef.current = null;
    });
  };

  const store = storeRef.current;

  return (
    <MeasureContext.Provider value={measure}>
      {open && store ? (
        <StoreContext.Provider value={store}>
          <Editor onExit={exitToDashboard} />
        </StoreContext.Provider>
      ) : (
        <Dashboard measure={measure} onOpen={openDesign} />
      )}
    </MeasureContext.Provider>
  );
};
