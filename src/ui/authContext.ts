/**
 * React bindings for the account store.
 *
 * The store is framework-free; this is the only adapter between it and React,
 * matching `storeContext.ts` for the editor. `useProjectStore` is here too
 * because where a design is saved follows from who is signed in, and that
 * answer should be derived in one place rather than at each call site.
 */

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';

import type { AccountState, AccountStore } from '../application/auth/accountStore.js';
import { chooseProjectStore, type ProjectStore } from '../application/projectStore.js';
import { canEditRemotely } from '../domain/account.js';

export const AccountContext = createContext<AccountStore | null>(null);

export const useAccount = (): AccountStore => {
  const store = useContext(AccountContext);
  if (!store) throw new Error('AccountContext 없이 사용되었습니다.');
  return store;
};

export const useAccountState = (): AccountState => {
  const store = useAccount();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
};

/** The store that should hold this person's designs right now. */
export const useProjectStore = (): ProjectStore => {
  const { status, profile } = useAccountState();
  const remote = status === 'signed-in' && canEditRemotely(profile);
  return useMemo(() => chooseProjectStore(remote), [remote]);
};
