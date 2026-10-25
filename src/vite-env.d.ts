/// <reference types="vite/client" />

/**
 * Build-time configuration.
 *
 * Both values are optional: a build without them is a complete, working local
 * editor with the account features withheld. Only the anon key belongs here —
 * it is meant to be public and is protected by row-level security. A
 * service-role key must never reach the client bundle.
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
