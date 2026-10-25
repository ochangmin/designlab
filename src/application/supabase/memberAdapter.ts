/**
 * The member directory, backed by the `profiles` table.
 *
 * Every statement here is also guarded by row-level security, so an ordinary
 * member running this code against the server gets nothing back. The UI hides
 * the screen as a courtesy; the database is what actually refuses.
 */

import { parseProfile, type Profile, type UserId, type UserRole } from '../../domain/account.js';
import type { StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';
import type { MemberDirectory } from '../auth/memberPort.js';
import { supabase } from './client.js';

const COLUMNS = 'id, email, display_name, role, provider, disabled, created_at';

const translate = (
  code: string | undefined,
  message: string,
  action: string,
): StudioError =>
  code === '42501' || code === 'PGRST116'
    ? { kind: 'permission-denied', action }
    : { kind: 'remote-unavailable', detail: message };

export const supabaseMembers: MemberDirectory = {
  list: async (): Promise<Result<readonly Profile[], StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { data, error } = await client
      .from('profiles')
      .select(COLUMNS)
      .order('created_at', { ascending: false });
    if (error) return err(translate(error.code, error.message, '회원 목록 조회'));

    const members: Profile[] = [];
    for (const row of data ?? []) {
      const parsed = parseProfile(row);
      if (!parsed.ok) return parsed;
      members.push(parsed.value);
    }
    return ok(members);
  },

  setRole: async (userId: UserId, role: UserRole): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { error } = await client.from('profiles').update({ role }).eq('id', userId);
    if (error) return err(translate(error.code, error.message, '역할 변경'));
    return ok(undefined);
  },

  setDisabled: async (userId: UserId, disabled: boolean): Promise<Result<void, StudioError>> => {
    const client = supabase();
    if (!client) return err({ kind: 'auth-not-configured' });
    const { error } = await client.from('profiles').update({ disabled }).eq('id', userId);
    if (error) return err(translate(error.code, error.message, '계정 상태 변경'));
    return ok(undefined);
  },
};
