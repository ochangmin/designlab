/** The editor shell: layout, autosave and the one place shortcuts are bound. */

import { useEffect, type ReactElement } from 'react';

import { saveProject } from '../../application/projectRepository.js';
import { Inspector } from './Inspector.js';
import { LeftRail } from './LeftRail.js';
import { PagesStrip } from './PagesStrip.js';
import { TopBar } from './TopBar.js';
import { Workspace } from './Workspace.js';
import { useEditorState, useStore } from '../storeContext.js';
import { useShortcuts } from './useShortcuts.js';

const AUTOSAVE_DELAY_MS = 700;

export interface EditorProps {
  readonly onExit: () => void;
}

export const Editor = ({ onExit }: EditorProps): ReactElement => {
  const store = useStore();
  const state = useEditorState();
  useShortcuts(store);

  // Autosave is debounced on the document itself, so a drag writes once when it
  // settles rather than on every pointer event.
  useEffect(() => {
    const timer = globalThis.setTimeout(() => {
      const result = saveProject(state.design);
      if (!result.ok) {
        store.reportError(result.error);
        return;
      }
      store.markSaved();
    }, AUTOSAVE_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [state.design, store]);

  useEffect(() => {
    if (state.notice === null) return;
    const timer = globalThis.setTimeout(() => store.dismissNotice(), 4200);
    return () => globalThis.clearTimeout(timer);
  }, [state.notice, store]);

  return (
    <div className="editor">
      <TopBar onExit={onExit} />
      <div className="editor__body">
        <LeftRail />
        <main className="editor__main">
          <Workspace />
          {state.design.pages.length > 0 && <PagesStrip />}
        </main>
        <Inspector />
      </div>
      {state.notice !== null && (
        <div className={`toast toast--${state.notice.tone}`} role="status">
          <span>{state.notice.message}</span>
          <button type="button" onClick={() => store.dismissNotice()} aria-label="알림 닫기">
            ×
          </button>
        </div>
      )}
    </div>
  );
};
