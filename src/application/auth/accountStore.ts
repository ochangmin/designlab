/**
 * Who is signed in, and what the last account action did.
 *
 * Framework-free, like `editorStore`: it owns the subscription to the auth
 * port and the member profile that goes with a session, and publishes one
 * state that the UI reads. Feedback from an action is held here too, so the
 * sign-in form does not keep its own copy of what went wrong.
 */

import { canEditRemotely, type AuthProvider, type AuthSession, type Profile } from '../../domain/account.js';
import type { StudioError } from '../../domain/errors.js';
import { createId } from '../../domain/ids.js';
import type { AuthPort, SignUpInput } from './authPort.js';

export type AccountStatus =
  /** The stored session has not been restored yet. */
  | 'loading'
  /** This build has no account server; everything stays local. */
  | 'unavailable'
  | 'signed-out'
  | 'signed-in';

export interface AccountNotice {
  readonly id: string;
  readonly tone: 'info' | 'error';
  readonly message: string;
}

export interface AccountState {
  readonly status: AccountStatus;
  readonly session: AuthSession | null;
  readonly profile: Profile | null;
  /** True while an account action is in flight; the form disables itself. */
  readonly busy: boolean;
  readonly error: StudioError | null;
  readonly notice: AccountNotice | null;
}

export class AccountStore {
  readonly #port: AuthPort;
  #state: AccountState;
  readonly #listeners = new Set<() => void>();
  #unsubscribe: (() => void) | null = null;

  constructor(port: AuthPort) {
    this.#port = port;
    this.#state = {
      status: port.configured ? 'loading' : 'unavailable',
      session: null,
      profile: null,
      busy: false,
      error: null,
      notice: null,
    };
  }

  getState = (): AccountState => this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  #set = (patch: Partial<AccountState>): void => {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener();
  };

  /** Restore any stored session and follow it from then on. */
  start = async (): Promise<void> => {
    if (!this.#port.configured) return;
    this.#unsubscribe ??= this.#port.onSessionChange((session) => {
      void this.#adopt(session);
    });
    await this.#port.ready();
    await this.#adopt(this.#port.currentSession());
  };

  stop = (): void => {
    this.#unsubscribe?.();
    this.#unsubscribe = null;
  };

  /**
   * Take on a session and the profile that belongs to it. A session whose
   * profile cannot be read is reported rather than treated as signed out: the
   * identity is real, and hiding that would make the failure look like a
   * logout the person did not ask for.
   */
  #adopt = async (session: AuthSession | null): Promise<void> => {
    if (session === null) {
      this.#set({ status: 'signed-out', session: null, profile: null });
      return;
    }
    const profile = await this.#port.loadProfile(session.userId);
    if (!profile.ok) {
      this.#set({ status: 'signed-in', session, profile: null, error: profile.error });
      return;
    }
    this.#set({ status: 'signed-in', session, profile: profile.value, error: null });
  };

  #notify = (tone: AccountNotice['tone'], message: string): void =>
    this.#set({ notice: { id: createId('acc'), tone, message }, error: null });

  #fail = (error: StudioError): void => this.#set({ error, notice: null, busy: false });

  clearFeedback = (): void => this.#set({ error: null, notice: null });

  signUp = async (input: SignUpInput): Promise<void> => {
    this.#set({ busy: true, error: null, notice: null });
    const result = await this.#port.signUpWithPassword(input);
    if (!result.ok) {
      this.#fail(result.error);
      return;
    }
    this.#set({ busy: false });
    if (result.value.needsEmailConfirmation) {
      this.#notify('info', `${input.email.trim()}로 확인 메일을 보냈습니다. 링크를 눌러 가입을 마무리해 주세요.`);
      return;
    }
    this.#notify('info', '가입이 완료되었습니다.');
  };

  signIn = async (email: string, password: string): Promise<void> => {
    this.#set({ busy: true, error: null, notice: null });
    const result = await this.#port.signInWithPassword(email, password);
    if (!result.ok) {
      this.#fail(result.error);
      return;
    }
    this.#set({ busy: false });
  };

  signInWith = async (provider: AuthProvider): Promise<void> => {
    this.#set({ busy: true, error: null, notice: null });
    const result = await this.#port.signInWithProvider(provider);
    // On success the browser is leaving for the provider, so `busy` stays set
    // until the page is replaced.
    if (!result.ok) this.#fail(result.error);
  };

  requestPasswordReset = async (email: string): Promise<void> => {
    this.#set({ busy: true, error: null, notice: null });
    const result = await this.#port.requestPasswordReset(email);
    if (!result.ok) {
      this.#fail(result.error);
      return;
    }
    this.#set({ busy: false });
    this.#notify('info', `${email.trim()}로 비밀번호 재설정 메일을 보냈습니다.`);
  };

  signOut = async (): Promise<void> => {
    this.#set({ busy: true, error: null, notice: null });
    const result = await this.#port.signOut();
    if (!result.ok) {
      this.#fail(result.error);
      return;
    }
    this.#set({ busy: false, status: 'signed-out', session: null, profile: null });
  };

  /** Whether this member's work should be stored on the server. */
  usesRemoteStorage = (): boolean =>
    this.#state.status === 'signed-in' && canEditRemotely(this.#state.profile);
}
