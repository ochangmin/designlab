import { describe, expect, it } from 'vitest';

import { AccountStore } from '../src/application/auth/accountStore.js';
import type { AuthPort, SignUpOutcome } from '../src/application/auth/authPort.js';
import type { AuthSession, Profile } from '../src/domain/account.js';
import type { StudioError } from '../src/domain/errors.js';
import { err, ok, type Result } from '../src/domain/result.js';

const SESSION: AuthSession = { userId: 'u1', email: 'pat@example.com', provider: 'password' };

const PROFILE: Profile = {
  id: 'u1',
  email: 'pat@example.com',
  displayName: '패트',
  role: 'member',
  provider: 'password',
  disabled: false,
  createdAt: 0,
};

interface FakeOptions {
  readonly configured?: boolean;
  readonly session?: AuthSession | null;
  readonly profile?: Result<Profile, StudioError>;
  readonly signIn?: Result<void, StudioError>;
  readonly signUp?: Result<SignUpOutcome, StudioError>;
}

/** A port that answers from fixtures; no network, no SDK. */
const fakePort = (options: FakeOptions = {}): AuthPort => {
  let current: AuthSession | null = options.session ?? null;
  const listeners = new Set<(session: AuthSession | null) => void>();
  return {
    configured: options.configured ?? true,
    ready: () => Promise.resolve(),
    currentSession: () => current,
    onSessionChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    signUpWithPassword: () =>
      Promise.resolve(options.signUp ?? ok({ needsEmailConfirmation: false })),
    signInWithPassword: () => {
      const outcome = options.signIn ?? ok(undefined);
      if (outcome.ok) {
        current = SESSION;
        for (const listener of listeners) listener(current);
      }
      return Promise.resolve(outcome);
    },
    signInWithProvider: () => Promise.resolve(ok(undefined)),
    requestPasswordReset: () => Promise.resolve(ok(undefined)),
    signOut: () => {
      current = null;
      return Promise.resolve(ok(undefined));
    },
    loadProfile: () => Promise.resolve(options.profile ?? ok(PROFILE)),
  };
};

describe('AccountStore', () => {
  it('reports accounts as unavailable when the build has no server', async () => {
    const store = new AccountStore(fakePort({ configured: false }));
    expect(store.getState().status).toBe('unavailable');
    await store.start();
    expect(store.getState().status).toBe('unavailable');
    expect(store.usesRemoteStorage()).toBe(false);
  });

  it('restores a stored session and the profile that belongs to it', async () => {
    const store = new AccountStore(fakePort({ session: SESSION }));
    await store.start();
    const state = store.getState();
    expect(state.status).toBe('signed-in');
    expect(state.profile?.displayName).toBe('패트');
    expect(store.usesRemoteStorage()).toBe(true);
  });

  it('settles on signed-out when there is no stored session', async () => {
    const store = new AccountStore(fakePort());
    await store.start();
    expect(store.getState().status).toBe('signed-out');
    expect(store.usesRemoteStorage()).toBe(false);
  });

  it('keeps a session whose profile cannot be read, and reports why', async () => {
    const store = new AccountStore(
      fakePort({ session: SESSION, profile: err({ kind: 'remote-unavailable', detail: '연결 끊김' }) }),
    );
    await store.start();
    const state = store.getState();
    // The identity is real; reporting it as a sign-out would look like a
    // logout nobody asked for.
    expect(state.status).toBe('signed-in');
    expect(state.profile).toBeNull();
    expect(state.error?.kind).toBe('remote-unavailable');
    expect(store.usesRemoteStorage()).toBe(false);
  });

  it('withholds remote storage from a suspended member', async () => {
    const store = new AccountStore(
      fakePort({ session: SESSION, profile: ok({ ...PROFILE, disabled: true }) }),
    );
    await store.start();
    expect(store.getState().status).toBe('signed-in');
    expect(store.usesRemoteStorage()).toBe(false);
  });

  it('signs in and adopts the new session', async () => {
    const store = new AccountStore(fakePort());
    await store.start();
    await store.signIn('pat@example.com', 'password123');
    expect(store.getState().status).toBe('signed-in');
    expect(store.getState().busy).toBe(false);
  });

  it('reports a failed sign-in without leaving the form disabled', async () => {
    const store = new AccountStore(fakePort({ signIn: err({ kind: 'auth-invalid-credentials' }) }));
    await store.start();
    await store.signIn('pat@example.com', 'wrong-password');
    const state = store.getState();
    expect(state.error?.kind).toBe('auth-invalid-credentials');
    expect(state.busy).toBe(false);
    expect(state.status).toBe('signed-out');
  });

  it('says a confirmation mail is waiting rather than claiming a sign-in', async () => {
    const store = new AccountStore(fakePort({ signUp: ok({ needsEmailConfirmation: true }) }));
    await store.start();
    await store.signUp({ email: 'new@example.com', password: 'password123', displayName: '새 사용자' });
    const state = store.getState();
    expect(state.status).toBe('signed-out');
    expect(state.notice?.tone).toBe('info');
    expect(state.notice?.message).toContain('new@example.com');
  });

  it('clears the session on sign-out', async () => {
    const store = new AccountStore(fakePort({ session: SESSION }));
    await store.start();
    await store.signOut();
    const state = store.getState();
    expect(state.status).toBe('signed-out');
    expect(state.profile).toBeNull();
    expect(store.usesRemoteStorage()).toBe(false);
  });

  it('publishes every change to subscribers', async () => {
    const store = new AccountStore(fakePort({ session: SESSION }));
    let notifications = 0;
    const unsubscribe = store.subscribe(() => {
      notifications += 1;
    });
    await store.start();
    expect(notifications).toBeGreaterThan(0);
    unsubscribe();
  });
});
