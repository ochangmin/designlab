/**
 * The Supabase implementation of `AuthPort`.
 *
 * Its main job beyond forwarding calls is interpretation: the provider reports
 * failures as a message string plus a status code, and this module is the one
 * place that turns those into the application's tagged errors. A cause it
 * cannot classify stays `auth-failed` carrying the provider's own words rather
 * than being flattened into "wrong password".
 */

import type { AuthError, Session, User } from '@supabase/supabase-js';

import {
  displayNameFrom,
  parseProfile,
  PASSWORD_MIN_LENGTH,
  type AuthProvider,
  type AuthSession,
  type Profile,
  type UserId,
} from '../../domain/account.js';
import type { StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';
import type { AuthPort, SignUpInput, SignUpOutcome } from '../auth/authPort.js';
import { isSupabaseConfigured, redirectTarget, supabase } from './client.js';

const NOT_CONFIGURED: StudioError = { kind: 'auth-not-configured' };

/** `app_metadata.provider` in the provider's vocabulary, in ours. */
const providerOf = (user: User | null): AuthProvider => {
  const raw = user?.app_metadata?.['provider'];
  if (raw === 'google') return 'google';
  if (raw === 'kakao') return 'kakao';
  return 'password';
};

const sessionOf = (session: Session | null): AuthSession | null => {
  if (!session) return null;
  return {
    userId: session.user.id,
    email: session.user.email ?? null,
    provider: providerOf(session.user),
  };
};

/**
 * Classify an authentication failure.
 *
 * Supabase's `code` field is the reliable signal; the message is matched only
 * where no code is sent. Anything unrecognised keeps its original text so a
 * report can say what actually happened.
 */
const classify = (error: AuthError, context: { readonly email?: string }): StudioError => {
  const code = error.code ?? '';
  const message = error.message;
  const lower = message.toLowerCase();

  if (code === 'invalid_credentials' || lower.includes('invalid login credentials')) {
    return { kind: 'auth-invalid-credentials' };
  }
  if (code === 'user_already_exists' || code === 'email_exists' || lower.includes('already registered')) {
    return { kind: 'auth-email-taken', email: context.email ?? '' };
  }
  if (code === 'weak_password' || lower.includes('password should be at least')) {
    return { kind: 'auth-weak-password', minimumLength: PASSWORD_MIN_LENGTH };
  }
  if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return { kind: 'auth-email-unconfirmed', email: context.email ?? '' };
  }
  if (error.status === 429 || code === 'over_request_rate_limit' || lower.includes('rate limit')) {
    return { kind: 'auth-rate-limited', detail: message };
  }
  return { kind: 'auth-failed', detail: message };
};

const listeners = new Set<(session: AuthSession | null) => void>();
let subscribed = false;
let restored: Promise<void> | null = null;

const ensureSubscription = (): void => {
  const client = supabase();
  if (!client || subscribed) return;
  subscribed = true;
  client.auth.onAuthStateChange((_event, session) => {
    const next = sessionOf(session);
    for (const listener of listeners) listener(next);
  });
};

let latest: AuthSession | null = null;

export const supabaseAuth: AuthPort = {
  configured: isSupabaseConfigured,

  ready: (): Promise<void> => {
    const client = supabase();
    if (!client) return Promise.resolve();
    ensureSubscription();
    restored ??= client.auth.getSession().then(({ data }) => {
      latest = sessionOf(data.session);
      for (const listener of listeners) listener(latest);
    });
    return restored;
  },

  currentSession: (): AuthSession | null => latest,

  onSessionChange: (listener): (() => void) => {
    ensureSubscription();
    const wrapped = (session: AuthSession | null): void => {
      latest = session;
      listener(session);
    };
    listeners.add(wrapped);
    return () => {
      listeners.delete(wrapped);
    };
  },

  signUpWithPassword: async (input: SignUpInput): Promise<Result<SignUpOutcome, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    const email = input.email.trim();
    const { data, error } = await client.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: redirectTarget(),
        // Read back by the database trigger that creates the profile row.
        data: { display_name: displayNameFrom([input.displayName], email) },
      },
    });
    if (error) return err(classify(error, { email }));
    // A project with email confirmation on returns a user and no session.
    return ok({ needsEmailConfirmation: data.session === null });
  },

  signInWithPassword: async (email: string, password: string): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    const trimmed = email.trim();
    const { error } = await client.auth.signInWithPassword({ email: trimmed, password });
    if (error) return err(classify(error, { email: trimmed }));
    return ok(undefined);
  },

  signInWithProvider: async (provider: AuthProvider): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    if (provider === 'password') {
      return err({ kind: 'auth-provider-failed', provider, detail: '소셜 로그인 공급자가 아닙니다.' });
    }
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTarget() },
    });
    if (error) return err({ kind: 'auth-provider-failed', provider, detail: error.message });
    return ok(undefined);
  },

  requestPasswordReset: async (email: string): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    const trimmed = email.trim();
    const { error } = await client.auth.resetPasswordForEmail(trimmed, {
      redirectTo: redirectTarget(),
    });
    if (error) return err(classify(error, { email: trimmed }));
    return ok(undefined);
  },

  signOut: async (): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    const { error } = await client.auth.signOut();
    if (error) return err(classify(error, {}));
    latest = null;
    return ok(undefined);
  },

  loadProfile: async (userId: UserId): Promise<Result<Profile, StudioError>> => {
    const client = supabase();
    if (!client) return err(NOT_CONFIGURED);
    const { data, error } = await client
      .from('profiles')
      .select('id, email, display_name, role, provider, disabled, created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) return err({ kind: 'remote-unavailable', detail: error.message });
    if (data === null) {
      // The row is created by a trigger on sign-up; its absence means the
      // migration has not been applied to this project.
      return err({
        kind: 'remote-unavailable',
        detail: '프로필 행이 없습니다. supabase/migrations 를 적용했는지 확인해 주세요.',
      });
    }
    return parseProfile(data);
  },
};
