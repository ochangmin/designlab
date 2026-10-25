/**
 * The application root.
 *
 * It owns the three things the rest of the app reads through context — the
 * editor store for the open document, the text-measurement port, and who is
 * signed in — and the single piece of routing state: the dashboard, an open
 * design, or member management.
 *
 * Where a design is saved is never decided here. `useProjectStore()` answers
 * that from the account state, so signing in moves the work to the server
 * without any screen learning a second code path.
 */

import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { AccountStore } from '../application/auth/accountStore.js';
import { EditorStore } from '../application/editorStore.js';
import { rememberLastOpened } from '../application/projectRepository.js';
import { supabaseAuth } from '../application/supabase/authAdapter.js';
import { isAdmin } from '../domain/account.js';
import type { Design } from '../domain/document.js';
import { createCanvasMeasure, type MeasureText } from '../domain/textLayout.js';
import { MembersScreen } from './admin/MembersScreen.js';
import { AuthDialog } from './auth/AuthDialog.js';
import { AccountContext, useAccountState, useProjectStore } from './authContext.js';
import { Dashboard } from './Dashboard.js';
import { Editor } from './editor/Editor.js';
import { MeasureContext, StoreContext } from './storeContext.js';
import { startViewTransition } from './viewTransition.js';

type View = { readonly kind: 'dashboard' } | { readonly kind: 'editor' } | { readonly kind: 'members' };

const Shell = ({ measure }: { readonly measure: MeasureText }): ReactElement => {
  const projects = useProjectStore();
  const account = useAccountState();
  const [view, setView] = useState<View>({ kind: 'dashboard' });
  const [authOpen, setAuthOpen] = useState(false);
  const storeRef = useRef<EditorStore | null>(null);

  // Member management is an admin capability: losing the role closes it rather
  // than leaving a screen open that every request would now refuse.
  useEffect(() => {
    if (view.kind === 'members' && !isAdmin(account.profile)) setView({ kind: 'dashboard' });
  }, [view.kind, account.profile]);

  const openDesign = async (design: Design): Promise<void> => {
    // A design reaches the editor only after it exists in storage, so a reload
    // immediately after opening finds it.
    const saved = await projects.save(design);
    if (saved.ok) rememberLastOpened(design.id);
    const store = new EditorStore(design);
    if (saved.ok) store.markSaved();
    else store.reportError(saved.error);
    storeRef.current = store;
    startViewTransition(() => setView({ kind: 'editor' }));
  };

  const exitToDashboard = (): void => {
    startViewTransition(() => {
      setView({ kind: 'dashboard' });
      storeRef.current = null;
    });
  };

  const store = storeRef.current;

  return (
    <>
      {view.kind === 'editor' && store ? (
        <StoreContext.Provider value={store}>
          <Editor onExit={exitToDashboard} />
        </StoreContext.Provider>
      ) : view.kind === 'members' ? (
        <MembersScreen onExit={() => setView({ kind: 'dashboard' })} />
      ) : (
        <Dashboard
          measure={measure}
          onOpen={(design) => void openDesign(design)}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenMembers={() => setView({ kind: 'members' })}
        />
      )}
      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} />}
    </>
  );
};

export const App = (): ReactElement => {
  const measure = useMemo(() => createCanvasMeasure(), []);
  const account = useMemo(() => new AccountStore(supabaseAuth), []);

  useEffect(() => {
    void account.start();
    return () => account.stop();
  }, [account]);

  return (
    <MeasureContext.Provider value={measure}>
      <AccountContext.Provider value={account}>
        <Shell measure={measure} />
      </AccountContext.Provider>
    </MeasureContext.Provider>
  );
};
