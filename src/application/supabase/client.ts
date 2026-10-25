/**
 * The one place that constructs a Supabase client.
 *
 * Everything the SDK touches lives under `application/supabase/`; no module
 * outside this directory imports `@supabase/supabase-js`, which
 * `tests/moduleBoundaries.test.ts` checks. The rest of the application speaks
 * to the narrow ports in `application/auth/` and `application/projectStore.ts`
 * instead, so swapping the provider stays a change to this directory.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

/** Whether this build has a project to talk to at all. */
export const isSupabaseConfigured = url !== '' && anonKey !== '';

let cached: SupabaseClient | null = null;

/**
 * The shared client, or `null` when the build carries no configuration.
 * Callers treat `null` as "accounts are unavailable", never as an error.
 */
export const supabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // The OAuth providers return to the app with a code in the URL, which
      // the client exchanges and then cleans up.
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });
  return cached;
};

/** Where a provider should send the browser back to after signing in. */
export const redirectTarget = (): string => {
  const { origin, pathname } = globalThis.location;
  return `${origin}${pathname}`;
};
