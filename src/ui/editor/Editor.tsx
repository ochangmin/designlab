/** The editor shell: layout, autosave and the one place shortcuts are bound. */

import { useEffect, type ReactElement } from 'react';

import { useProjectStore } from '../authContext.js';
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
  const projects = useProjectStore();
  useShortcuts(store);

  // Autosave is debounced on the document itself, so a drag writes once when it
  // settles rather than on every pointer event. A write that is still in flight
  // when the next edit lands is abandoned by `cancelled`, so a slow response
  // cannot report an older document as the saved one.
  useEffect(() => {
    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      void projects.save(state.design).then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          store.reportError(result.error);
          return;
        }
        store.markSaved();
      });
    }, AUTOSAVE_DELAY_MS);
    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [state.design, store, projects]);

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
        // Keyed by notice so a second message replays the entrance and the
        // timer bar, rather than inheriting the first one's remaining time.
        <div key={state.notice.id} className={`toast toast--${state.notice.tone}`} role="status">
          <span>{state.notice.message}</span>
          <button type="button" onClick={() => store.dismissNotice()} aria-label="알림 닫기">
            ×
          </button>
          <span className="toast__timer" aria-hidden="true" />
        </div>
      )}
    </div>
  );
};
