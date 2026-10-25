/**
 * The account entry in the top bar.
 *
 * Says where the person's work is being kept, which is the part that actually
 * changes their day: signed out, designs stay in this browser; signed in, they
 * follow the account.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';

import { isAdmin, PROVIDER_LABELS, ROLE_LABELS } from '../../domain/account.js';
import { useAccount, useAccountState } from '../authContext.js';
import '../account.css';

export interface AccountMenuProps {
  readonly onOpenAuth: () => void;
  readonly onOpenMembers: () => void;
}

export const AccountMenu = ({ onOpenAuth, onOpenMembers }: AccountMenuProps): ReactElement => {
  const account = useAccount();
  const state = useAccountState();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    globalThis.addEventListener('pointerdown', onPointerDown);
    return () => globalThis.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (state.status === 'loading') {
    return <span className="badge">계정 확인 중…</span>;
  }

  if (state.status === 'unavailable') {
    // Clickable on purpose: somebody looking for a sign-in button deserves to
    // be told why there isn't one, rather than finding nothing at all.
    return (
      <button
        type="button"
        className="badge"
        style={{ cursor: 'pointer', border: 0, font: 'inherit', fontWeight: 600 }}
        title="이 빌드에는 계정 서버가 연결되어 있지 않아 디자인이 이 브라우저에만 저장됩니다."
        onClick={onOpenAuth}
      >
        로컬 저장
      </button>
    );
  }

  if (state.status === 'signed-out') {
    return (
      <button type="button" className="button" onClick={onOpenAuth}>
        로그인
      </button>
    );
  }

  const { profile, session } = state;
  const name = profile?.displayName ?? session?.email ?? '내 계정';
  const initial = name.slice(0, 1).toUpperCase();

  return (
    <div className="account" ref={container}>
      <button
        type="button"
        className="account__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account__avatar" aria-hidden="true">
          {initial}
        </span>
        <span className="account__name">{name}</span>
      </button>

      {profile?.disabled === true && <span className="badge badge--disabled">사용 중지됨</span>}

      {open && (
        <div className="account__menu" role="menu">
          <div className="account__identity">
            <strong>{name}</strong>
            <small>{session?.email ?? '이메일 없음'}</small>
            <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
              <span className={isAdmin(profile) ? 'badge badge--admin' : 'badge'}>
                {profile === null ? '정보 없음' : ROLE_LABELS[profile.role]}
              </span>
              {profile !== null && <span className="badge">{PROVIDER_LABELS[profile.provider]}</span>}
            </div>
          </div>

          {isAdmin(profile) && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenMembers();
              }}
            >
              회원 관리
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void account.signOut();
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
};
