import { describe, expect, it } from 'vitest';

import {
  canEditRemotely,
  checkCredentials,
  displayNameFrom,
  isAdmin,
  parseProfile,
  PASSWORD_MIN_LENGTH,
  type Profile,
} from '../src/domain/account.js';

const row = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'u1',
  email: 'pat@example.com',
  display_name: '패트',
  role: 'member',
  provider: 'password',
  disabled: false,
  created_at: '2026-01-02T03:04:05.000Z',
  ...overrides,
});

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'u1',
  email: 'pat@example.com',
  displayName: '패트',
  role: 'member',
  provider: 'password',
  disabled: false,
  createdAt: 0,
  ...overrides,
});

describe('parseProfile', () => {
  it('reads a well-formed row', () => {
    const parsed = parseProfile(row());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.displayName).toBe('패트');
    expect(parsed.value.role).toBe('member');
    expect(parsed.value.createdAt).toBe(Date.parse('2026-01-02T03:04:05.000Z'));
  });

  it('refuses an unknown role instead of assuming the lesser one', () => {
    const parsed = parseProfile(row({ role: 'superuser' }));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.at).toBe('$.role');
  });

  it('refuses an unknown provider', () => {
    const parsed = parseProfile(row({ provider: 'facebook' }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.at).toBe('$.provider');
  });

  it('requires an id', () => {
    const parsed = parseProfile(row({ id: '' }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.at).toBe('$.id');
  });

  it('falls back to the email local part when no name was supplied', () => {
    const parsed = parseProfile(row({ display_name: '   ' }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.displayName).toBe('pat');
  });

  it('treats a missing disabled flag as not disabled', () => {
    const parsed = parseProfile(row({ disabled: undefined }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.value.disabled).toBe(false);
  });

  it('rejects a row that is not an object', () => {
    expect(parseProfile(null).ok).toBe(false);
    expect(parseProfile('u1').ok).toBe(false);
  });
});

describe('displayNameFrom', () => {
  it('prefers the first non-blank candidate', () => {
    expect(displayNameFrom(['  ', null, '하늘'], 'x@y.z')).toBe('하늘');
  });

  it('falls back to the email local part, then to a placeholder', () => {
    expect(displayNameFrom([null], 'sam@example.com')).toBe('sam');
    expect(displayNameFrom([null], null)).toBe('이름 없는 사용자');
  });
});

describe('checkCredentials', () => {
  it('accepts a well-formed pair', () => {
    expect(checkCredentials('pat@example.com', 'x'.repeat(PASSWORD_MIN_LENGTH))).toEqual([]);
  });

  it('names an empty email separately from a malformed one', () => {
    expect(checkCredentials('  ', 'x'.repeat(10))).toEqual(['email-empty']);
    expect(checkCredentials('pat@', 'x'.repeat(10))).toEqual(['email-invalid']);
  });

  it('reports a short password', () => {
    expect(checkCredentials('pat@example.com', 'short')).toEqual(['password-short']);
  });

  it('reports every problem at once', () => {
    expect(checkCredentials('nope', 'x')).toEqual(['email-invalid', 'password-short']);
  });
});

describe('capabilities', () => {
  it('reads the admin role', () => {
    expect(isAdmin(profile({ role: 'admin' }))).toBe(true);
    expect(isAdmin(profile())).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });

  it('withholds remote editing from a suspended account, admin or not', () => {
    expect(canEditRemotely(profile())).toBe(true);
    expect(canEditRemotely(profile({ disabled: true }))).toBe(false);
    expect(canEditRemotely(profile({ role: 'admin', disabled: true }))).toBe(false);
    expect(canEditRemotely(null)).toBe(false);
  });
});
