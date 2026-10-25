/**
 * Tagged error algebra for every expected failure in the editor.
 *
 * Each error names the boundary that produced it and carries the smallest
 * useful evidence for a message a person can act on. Unknown causes stay
 * `unknown` rather than being reported as absent.
 */

export interface StorageUnavailable {
  readonly kind: 'storage-unavailable';
  readonly detail: string;
}

export interface StorageQuotaExceeded {
  readonly kind: 'storage-quota-exceeded';
  readonly detail: string;
}

export interface DocumentNotFound {
  readonly kind: 'document-not-found';
  readonly designId: string;
}

export interface DocumentMalformed {
  readonly kind: 'document-malformed';
  /** Where the parse stopped, e.g. `pages[2].elements[0].type`. */
  readonly at: string;
  readonly detail: string;
}

export interface UnsupportedAsset {
  readonly kind: 'unsupported-asset';
  readonly fileName: string;
  readonly mediaType: string;
}

export interface AssetTooLarge {
  readonly kind: 'asset-too-large';
  readonly fileName: string;
  readonly bytes: number;
  readonly limitBytes: number;
}

export interface AssetUnreadable {
  readonly kind: 'asset-unreadable';
  readonly fileName: string;
  readonly detail: string;
}

export interface ExportFailed {
  readonly kind: 'export-failed';
  readonly format: string;
  readonly detail: string;
}

/**
 * No Supabase project is configured for this build. Not a fault: the editor
 * runs entirely locally in that case, and only the account features are
 * withheld.
 */
export interface AuthNotConfigured {
  readonly kind: 'auth-not-configured';
}

export interface AuthInvalidCredentials {
  readonly kind: 'auth-invalid-credentials';
}

export interface AuthEmailTaken {
  readonly kind: 'auth-email-taken';
  readonly email: string;
}

export interface AuthWeakPassword {
  readonly kind: 'auth-weak-password';
  readonly minimumLength: number;
}

export interface AuthEmailUnconfirmed {
  readonly kind: 'auth-email-unconfirmed';
  readonly email: string;
}

export interface AuthRateLimited {
  readonly kind: 'auth-rate-limited';
  readonly detail: string;
}

export interface AuthProviderFailed {
  readonly kind: 'auth-provider-failed';
  readonly provider: string;
  readonly detail: string;
}

/** An authentication failure whose cause the provider did not name. */
export interface AuthFailed {
  readonly kind: 'auth-failed';
  readonly detail: string;
}

export interface NotAuthenticated {
  readonly kind: 'not-authenticated';
}

export interface AccountDisabled {
  readonly kind: 'account-disabled';
}

export interface PermissionDenied {
  readonly kind: 'permission-denied';
  /** What was attempted, in the caller's own words. */
  readonly action: string;
}

/** The remote store could not be reached or refused the request. */
export interface RemoteUnavailable {
  readonly kind: 'remote-unavailable';
  readonly detail: string;
}

export interface ProfileMalformed {
  readonly kind: 'profile-malformed';
  readonly at: string;
  readonly detail: string;
}

export type StudioError =
  | StorageUnavailable
  | StorageQuotaExceeded
  | DocumentNotFound
  | DocumentMalformed
  | UnsupportedAsset
  | AssetTooLarge
  | AssetUnreadable
  | ExportFailed
  | AuthNotConfigured
  | AuthInvalidCredentials
  | AuthEmailTaken
  | AuthWeakPassword
  | AuthEmailUnconfirmed
  | AuthRateLimited
  | AuthProviderFailed
  | AuthFailed
  | NotAuthenticated
  | AccountDisabled
  | PermissionDenied
  | RemoteUnavailable
  | ProfileMalformed;

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** A single human-readable line. The caller owns placement, not wording. */
export const describeError = (error: StudioError): string => {
  switch (error.kind) {
    case 'storage-unavailable':
      return `브라우저 저장소를 사용할 수 없습니다 (${error.detail}). 작업은 계속할 수 있지만 자동 저장은 되지 않습니다.`;
    case 'storage-quota-exceeded':
      return `저장 공간이 부족합니다 (${error.detail}). 사용하지 않는 디자인을 삭제하거나 파일로 내보내 주세요.`;
    case 'document-not-found':
      return `디자인을 찾을 수 없습니다 (${error.designId}).`;
    case 'document-malformed':
      return `디자인 파일을 읽을 수 없습니다. 위치: ${error.at} — ${error.detail}`;
    case 'unsupported-asset':
      return `지원하지 않는 형식입니다: ${error.fileName} (${error.mediaType || '형식 불명'}). PNG, JPEG, WebP, GIF, SVG를 사용해 주세요.`;
    case 'asset-too-large':
      return `${error.fileName}은(는) ${formatBytes(error.bytes)}로 한도 ${formatBytes(error.limitBytes)}를 넘습니다.`;
    case 'asset-unreadable':
      return `${error.fileName}을(를) 읽지 못했습니다: ${error.detail}`;
    case 'export-failed':
      return `${error.format} 내보내기에 실패했습니다: ${error.detail}`;
    case 'auth-not-configured':
      return '이 빌드에는 계정 서버가 연결되어 있지 않습니다. 편집과 로컬 저장은 그대로 사용할 수 있습니다.';
    case 'auth-invalid-credentials':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth-email-taken':
      return `${error.email}은(는) 이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 이용해 주세요.`;
    case 'auth-weak-password':
      return `비밀번호가 너무 짧습니다. ${error.minimumLength}자 이상으로 정해 주세요.`;
    case 'auth-email-unconfirmed':
      return `${error.email}로 보낸 확인 메일의 링크를 먼저 눌러 주세요.`;
    case 'auth-rate-limited':
      return `시도가 너무 잦습니다 (${error.detail}). 잠시 후 다시 시도해 주세요.`;
    case 'auth-provider-failed':
      return `${error.provider} 로그인에 실패했습니다: ${error.detail}`;
    case 'auth-failed':
      return `로그인 처리 중 문제가 발생했습니다: ${error.detail}`;
    case 'not-authenticated':
      return '로그인이 필요한 작업입니다.';
    case 'account-disabled':
      return '이 계정은 사용이 중지되었습니다. 관리자에게 문의해 주세요.';
    case 'permission-denied':
      return `권한이 없습니다: ${error.action}`;
    case 'remote-unavailable':
      return `서버에 연결하지 못했습니다 (${error.detail}). 이 작업은 저장되지 않았습니다.`;
    case 'profile-malformed':
      return `회원 정보를 읽을 수 없습니다. 위치: ${error.at} — ${error.detail}`;
  }
};
