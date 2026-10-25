/**
 * Accounts and membership.
 *
 * The one owner of what a member *is*: identity, how they signed in, what they
 * are allowed to do, and whether their access is suspended. Nothing outside
 * this module invents a second reading of a role or a provider, and every
 * value that arrives from the database passes through `parseProfile` first.
 */

import { err, ok, type Result } from './result.js';
import type { ProfileMalformed } from './errors.js';

export type UserId = string;

/**
 * Two roles, deliberately. `admin` is an operational capability — seeing and
 * changing other members — not a billing tier, so adding paid plans later does
 * not have to touch this.
 */
export type UserRole = 'member' | 'admin';

export type AuthProvider = 'password' | 'google' | 'kakao';

export const USER_ROLES: readonly UserRole[] = ['member', 'admin'];
export const AUTH_PROVIDERS: readonly AuthProvider[] = ['password', 'google', 'kakao'];

export const ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  member: '일반',
  admin: '관리자',
};

export const PROVIDER_LABELS: Readonly<Record<AuthProvider, string>> = {
  password: '이메일',
  google: 'Google',
  kakao: '카카오',
};

/** A signed-in identity, as the auth provider reports it. */
export interface AuthSession {
  readonly userId: UserId;
  readonly email: string | null;
  readonly provider: AuthProvider;
}

/** The member record this application owns, alongside the auth identity. */
export interface Profile {
  readonly id: UserId;
  readonly email: string | null;
  readonly displayName: string;
  readonly role: UserRole;
  readonly provider: AuthProvider;
  /** Suspended members keep their data but cannot read or write it. */
  readonly disabled: boolean;
  readonly createdAt: number;
}

export const isAdmin = (profile: Profile | null): boolean => profile?.role === 'admin';

/** A member may act when they are signed in and not suspended. */
export const canEditRemotely = (profile: Profile | null): boolean =>
  profile !== null && !profile.disabled;

/**
 * A display name that is always present. The providers disagree about which
 * field carries a name, and some supply none, so the fallback is derived here
 * rather than at each place a name is shown.
 */
export const displayNameFrom = (
  candidates: readonly (string | null | undefined)[],
  email: string | null,
): string => {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed !== undefined && trimmed !== '') return trimmed;
  }
  const localPart = email?.split('@')[0]?.trim();
  return localPart !== undefined && localPart !== '' ? localPart : '이름 없는 사용자';
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const fail = (at: string, detail: string): Result<never, ProfileMalformed> =>
  err({ kind: 'profile-malformed', at, detail });

/** Milliseconds from an ISO timestamp, or `null` when it cannot be read. */
const parseTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

/**
 * The single boundary between a stored row and a `Profile`.
 *
 * An unknown role is not treated as `member`: a row we cannot read correctly
 * must not silently become a lesser privilege that still grants access, so the
 * parse fails and the caller decides what to do about it.
 */
export const parseProfile = (value: unknown): Result<Profile, ProfileMalformed> => {
  if (!isRecord(value)) return fail('$', '프로필 행이 객체가 아닙니다.');

  const id = value['id'];
  if (typeof id !== 'string' || id === '') return fail('$.id', '사용자 id가 없습니다.');

  const role = value['role'];
  if (typeof role !== 'string' || !USER_ROLES.includes(role as UserRole)) {
    return fail('$.role', `알 수 없는 역할: ${String(role)}`);
  }

  const provider = value['provider'];
  if (typeof provider !== 'string' || !AUTH_PROVIDERS.includes(provider as AuthProvider)) {
    return fail('$.provider', `알 수 없는 가입 경로: ${String(provider)}`);
  }

  const email = typeof value['email'] === 'string' ? value['email'] : null;
  const createdAt = parseTimestamp(value['created_at'] ?? value['createdAt']);

  return ok({
    id,
    email,
    displayName: displayNameFrom(
      [typeof value['display_name'] === 'string' ? value['display_name'] : null],
      email,
    ),
    role: role as UserRole,
    provider: provider as AuthProvider,
    disabled: value['disabled'] === true,
    createdAt: createdAt ?? Date.now(),
  });
};

/** Rules the sign-up form and the server both read from one place. */
export const PASSWORD_MIN_LENGTH = 8;

export type CredentialProblem = 'email-empty' | 'email-invalid' | 'password-short';

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Local validation, stated as problems rather than booleans so the form can
 * say which field is wrong. It never claims an address exists — only the
 * provider can answer that.
 */
export const checkCredentials = (
  email: string,
  password: string,
): readonly CredentialProblem[] => {
  const problems: CredentialProblem[] = [];
  const trimmed = email.trim();
  if (trimmed === '') problems.push('email-empty');
  else if (!EMAIL_SHAPE.test(trimmed)) problems.push('email-invalid');
  if (password.length < PASSWORD_MIN_LENGTH) problems.push('password-short');
  return problems;
};

export const describeCredentialProblem = (problem: CredentialProblem): string => {
  switch (problem) {
    case 'email-empty':
      return '이메일을 입력해 주세요.';
    case 'email-invalid':
      return '이메일 주소 형식이 올바르지 않습니다.';
    case 'password-short':
      return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
  }
};
