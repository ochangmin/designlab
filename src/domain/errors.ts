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

export type StudioError =
  | StorageUnavailable
  | StorageQuotaExceeded
  | DocumentNotFound
  | DocumentMalformed
  | UnsupportedAsset
  | AssetTooLarge
  | AssetUnreadable
  | ExportFailed;

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
  }
};
