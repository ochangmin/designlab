/**
 * Member management, for administrators.
 *
 * The screen is hidden from everyone else, but that is not what protects it:
 * every statement it issues is checked by row-level security, and a denial
 * comes back as `permission-denied` and is shown. An admin cannot change their
 * own role or status here, because the database refuses it — one administrator
 * should not be able to lock the project out of its own management.
 */

import { useCallback, useEffect, useState, type ReactElement } from 'react';

import { supabaseMembers } from '../../application/supabase/memberAdapter.js';
import {
  PROVIDER_LABELS,
  ROLE_LABELS,
  USER_ROLES,
  type Profile,
  type UserRole,
} from '../../domain/account.js';
import { describeError, type StudioError } from '../../domain/errors.js';
import { useAccountState } from '../authContext.js';
import '../account.css';

const formatDate = (timestamp: number): string =>
  new Date(timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

export interface MembersScreenProps {
  readonly onExit: () => void;
}

export const MembersScreen = ({ onExit }: MembersScreenProps): ReactElement => {
  const { profile: me } = useAccountState();
  const [members, setMembers] = useState<readonly Profile[] | null>(null);
  const [error, setError] = useState<StudioError | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const result = await supabaseMembers.list();
    if (!result.ok) {
      setError(result.error);
      setMembers([]);
      return;
    }
    setError(null);
    setMembers(result.value);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const apply = async (userId: string, change: () => Promise<{ ok: boolean; error?: StudioError }>): Promise<void> => {
    setBusyId(userId);
    const result = await change();
    setBusyId(null);
    if (!result.ok && result.error) {
      setError(result.error);
      return;
    }
    await reload();
  };

  const changeRole = (member: Profile, role: UserRole): void => {
    void apply(member.id, async () => {
      const outcome = await supabaseMembers.setRole(member.id, role);
      return outcome.ok ? { ok: true } : { ok: false, error: outcome.error };
    });
  };

  const changeDisabled = (member: Profile, disabled: boolean): void => {
    void apply(member.id, async () => {
      const outcome = await supabaseMembers.setDisabled(member.id, disabled);
      return outcome.ok ? { ok: true } : { ok: false, error: outcome.error };
    });
  };

  return (
    <div className="dashboard">
      <header className="topnav">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true" />
          <div>
            <span className="brand__name">회원 관리</span>
            <p>가입 경로와 권한, 계정 상태를 확인하고 변경합니다</p>
          </div>
        </div>
        <button type="button" className="button" onClick={onExit}>
          ‹ 홈으로
        </button>
      </header>

      {error !== null && (
        <p className="banner banner--error" role="status">
          {describeError(error)}
        </p>
      )}

      <section className="dashboard__section">
        <div className="dashboard__head">
          <h2>회원</h2>
          <span className="dashboard__count">
            {members === null ? '불러오는 중…' : `${members.length}명`}
          </span>
        </div>

        {members !== null && members.length === 0 && error === null ? (
          <p className="empty">아직 가입한 회원이 없습니다.</p>
        ) : (
          <table className="members">
            <thead>
              <tr>
                <th scope="col">회원</th>
                <th scope="col">가입 경로</th>
                <th scope="col">가입일</th>
                <th scope="col">상태</th>
                <th scope="col">권한</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => {
                const isSelf = member.id === me?.id;
                return (
                  <tr key={member.id}>
                    <td>
                      <span className="members__name">
                        <strong>{member.displayName}</strong>
                        <small>{member.email ?? '이메일 없음'}</small>
                      </span>
                    </td>
                    <td>{PROVIDER_LABELS[member.provider]}</td>
                    <td>{formatDate(member.createdAt)}</td>
                    <td>
                      {member.disabled ? (
                        <span className="badge badge--disabled">중지됨</span>
                      ) : (
                        <span className="badge">사용 중</span>
                      )}
                    </td>
                    <td>
                      <span className="members__actions">
                        {isSelf ? (
                          <>
                            <span className={member.role === 'admin' ? 'badge badge--admin' : 'badge'}>
                              {ROLE_LABELS[member.role]}
                            </span>
                            <span className="members__self">본인</span>
                          </>
                        ) : (
                          <>
                            <select
                              className="select"
                              style={{ width: 'auto' }}
                              value={member.role}
                              disabled={busyId === member.id}
                              aria-label={`${member.displayName} 권한`}
                              onChange={(event) => changeRole(member, event.target.value as UserRole)}
                            >
                              {USER_ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              className={member.disabled ? 'button' : 'button button--danger'}
                              disabled={busyId === member.id}
                              onClick={() => changeDisabled(member, !member.disabled)}
                            >
                              {member.disabled ? '사용 재개' : '사용 중지'}
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
