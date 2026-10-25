/**
 * The sign-in sheet.
 *
 * One surface for the three things a person does before they have a session:
 * sign in, sign up, ask for a password reset. It reuses the shared `.sheet`
 * shell, so its entrance is the same motion as every other dialog.
 */

import { useEffect, useState, type FormEvent, type ReactElement } from 'react';

import {
  checkCredentials,
  describeCredentialProblem,
  displayNameFrom,
  type AuthProvider,
} from '../../domain/account.js';
import { describeError } from '../../domain/errors.js';
import { useAccount, useAccountState } from '../authContext.js';
import '../account.css';

type Mode = 'sign-in' | 'sign-up' | 'reset';

const TITLES: Readonly<Record<Mode, string>> = {
  'sign-in': '로그인',
  'sign-up': '회원가입',
  reset: '비밀번호 재설정',
};

const SOCIAL: readonly { readonly provider: AuthProvider; readonly label: string }[] = [
  { provider: 'google', label: 'Google로 계속하기' },
  { provider: 'kakao', label: '카카오로 계속하기' },
];

export interface AuthDialogProps {
  readonly onClose: () => void;
}

export const AuthDialog = ({ onClose }: AuthDialogProps): ReactElement => {
  const account = useAccount();
  const state = useAccountState();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  // The sheet's job is done the moment a session exists.
  useEffect(() => {
    if (state.status === 'signed-in') onClose();
  }, [state.status, onClose]);

  const problems = mode === 'reset'
    ? checkCredentials(email, 'x'.repeat(64)).filter((problem) => problem !== 'password-short')
    : checkCredentials(email, password);
  const showProblems = touched && problems.length > 0;

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setTouched(true);
    if (problems.length > 0) return;
    if (mode === 'sign-in') {
      void account.signIn(email, password);
      return;
    }
    if (mode === 'sign-up') {
      void account.signUp({ email, password, displayName: displayNameFrom([name], email) });
      return;
    }
    void account.requestPasswordReset(email);
  };

  const switchTo = (next: Mode): void => {
    setMode(next);
    setTouched(false);
    account.clearFeedback();
  };

  if (!(state.status === 'signed-out' || state.status === 'unavailable' || state.status === 'loading')) {
    return <div />;
  }

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" aria-label={TITLES[mode]}>
      <div className="sheet">
        <header className="sheet__head">
          <h2>{TITLES[mode]}</h2>
          <button type="button" className="button button--quiet" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        {state.status === 'unavailable' ? (
          <>
            <p className="sheet__note">{describeError({ kind: 'auth-not-configured' })}</p>
            <p className="sheet__note">
              계정 기능을 켜려면 Supabase 프로젝트를 만들고 <code>VITE_SUPABASE_URL</code>,{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>를 설정한 뒤 다시 빌드해야 합니다. 자세한 절차는
              README의 “계정 서버 설정”을 보세요.
            </p>
            <div className="sheet__actions">
              <button type="button" className="button button--primary" onClick={onClose}>
                확인
              </button>
            </div>
          </>
        ) : (
          <>
            <form className="auth-form" onSubmit={submit}>
              {mode === 'sign-up' && (
                <label>
                  이름
                  <input
                    type="text"
                    value={name}
                    autoComplete="name"
                    placeholder="표시할 이름"
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
              )}

              <label>
                이메일
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  required
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>

              {mode !== 'reset' && (
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={password}
                    autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                    required
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
              )}

              {showProblems &&
                problems.map((problem) => (
                  <p key={problem} className="auth-problem" role="alert">
                    {describeCredentialProblem(problem)}
                  </p>
                ))}

              {state.error !== null && (
                <p className="auth-problem" role="alert">
                  {describeError(state.error)}
                </p>
              )}

              {state.notice !== null && <p className="sheet__note">{state.notice.message}</p>}

              <button type="submit" className="button button--primary" disabled={state.busy}>
                {state.busy ? '처리 중…' : TITLES[mode]}
              </button>
            </form>

            {mode !== 'reset' && (
              <>
                <div className="auth-divider">또는</div>
                <div className="auth-providers">
                  {SOCIAL.map(({ provider, label }) => (
                    <button
                      key={provider}
                      type="button"
                      className={`auth-provider auth-provider--${provider}`}
                      disabled={state.busy}
                      onClick={() => void account.signInWith(provider)}
                    >
                      <span className={'auth-provider__mark'} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {mode === 'sign-in' && (
              <p className="auth-switch">
                계정이 없으신가요? <button type="button" onClick={() => switchTo('sign-up')}>회원가입</button>
                {' · '}
                <button type="button" onClick={() => switchTo('reset')}>비밀번호 재설정</button>
              </p>
            )}
            {mode === 'sign-up' && (
              <p className="auth-switch">
                이미 가입하셨나요? <button type="button" onClick={() => switchTo('sign-in')}>로그인</button>
              </p>
            )}
            {mode === 'reset' && (
              <p className="auth-switch">
                <button type="button" onClick={() => switchTo('sign-in')}>로그인으로 돌아가기</button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
