/**
 * Reading and changing other people's membership.
 *
 * Separate from `AuthPort` on purpose: that port is about the person holding
 * the session, this one is an administrative capability over everyone else.
 * Keeping them apart means a screen that only needs "who am I" cannot reach
 * the directory by accident.
 *
 * Authorisation is not this port's promise. Row-level security on the server
 * decides every call, and a denial comes back as `permission-denied`.
 */

import type { Profile, UserId, UserRole } from '../../domain/account.js';
import type { StudioError } from '../../domain/errors.js';
import type { Result } from '../../domain/result.js';

export interface MemberDirectory {
  /** Every member, newest first. Denied for anyone who is not an admin. */
  list(): Promise<Result<readonly Profile[], StudioError>>;

  setRole(userId: UserId, role: UserRole): Promise<Result<void, StudioError>>;

  /** Suspending keeps the member's data and withdraws their access to it. */
  setDisabled(userId: UserId, disabled: boolean): Promise<Result<void, StudioError>>;
}
