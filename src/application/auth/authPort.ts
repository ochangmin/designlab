/**
 * The narrow contract the application has with an identity provider.
 *
 * Stated in this application's own vocabulary — `AuthSession`, `Profile`,
 * `StudioError` — so no provider type reaches the UI and a second
 * implementation (a fake in tests, another provider later) only has to satisfy
 * this file. Every method reports expected failures through `Result`.
 */

import type { AuthProvider, AuthSession, Profile, UserId } from '../../domain/account.js';
import type { StudioError } from '../../domain/errors.js';
import type { Result } from '../../domain/result.js';

export interface SignUpInput {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
}

export interface SignUpOutcome {
  /**
   * True when the provider created the account but withheld the session until
   * the address is confirmed. The caller must not report a completed sign-in.
   */
  readonly needsEmailConfirmation: boolean;
}

export interface AuthPort {
  /** False when the build carries no project configuration. */
  readonly configured: boolean;

  /** Resolves once the stored session has been restored, if there is one. */
  ready(): Promise<void>;

  currentSession(): AuthSession | null;

  /** Fires on sign-in, sign-out and token refresh. Returns an unsubscribe. */
  onSessionChange(listener: (session: AuthSession | null) => void): () => void;

  signUpWithPassword(input: SignUpInput): Promise<Result<SignUpOutcome, StudioError>>;

  signInWithPassword(email: string, password: string): Promise<Result<void, StudioError>>;

  /**
   * Leaves the page: the provider takes over and returns to the app. A
   * successful result therefore means "redirect started", not "signed in".
   */
  signInWithProvider(provider: AuthProvider): Promise<Result<void, StudioError>>;

  requestPasswordReset(email: string): Promise<Result<void, StudioError>>;

  signOut(): Promise<Result<void, StudioError>>;

  /** The member record for a signed-in identity. */
  loadProfile(userId: UserId): Promise<Result<Profile, StudioError>>;
}
