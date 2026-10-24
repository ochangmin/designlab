/**
 * Image intake.
 *
 * Uploaded files are normalised once, here, into a data URL plus its intrinsic
 * size, so the rest of the editor never deals with `File` objects or has to
 * discover an image's dimensions a second time.
 */

import { err, ok, type Result } from '../domain/result.js';
import type { StudioError } from '../domain/errors.js';

const MAX_BYTES = 8 * 1024 * 1024;

const ACCEPTED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);

export interface ImportedImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly name: string;
}

const readAsDataUrl = (file: File): Promise<Result<string, StudioError>> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () =>
      resolve(
        err({
          kind: 'asset-unreadable',
          fileName: file.name,
          detail: reader.error?.message ?? '읽기 오류',
        }),
      );
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        resolve(err({ kind: 'asset-unreadable', fileName: file.name, detail: '예상과 다른 형식' }));
        return;
      }
      resolve(ok(result));
    };
    reader.readAsDataURL(file);
  });

const measure = (src: string, name: string): Promise<Result<{ width: number; height: number }, StudioError>> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () =>
      resolve(
        ok({
          width: image.naturalWidth > 0 ? image.naturalWidth : 800,
          height: image.naturalHeight > 0 ? image.naturalHeight : 600,
        }),
      );
    image.onerror = () =>
      resolve(err({ kind: 'asset-unreadable', fileName: name, detail: '이미지를 디코딩할 수 없습니다.' }));
    image.src = src;
  });

export const importImageFile = async (file: File): Promise<Result<ImportedImage, StudioError>> => {
  if (!ACCEPTED.has(file.type)) {
    return err({ kind: 'unsupported-asset', fileName: file.name, mediaType: file.type });
  }
  if (file.size > MAX_BYTES) {
    return err({ kind: 'asset-too-large', fileName: file.name, bytes: file.size, limitBytes: MAX_BYTES });
  }
  const dataUrl = await readAsDataUrl(file);
  if (!dataUrl.ok) return dataUrl;
  const size = await measure(dataUrl.value, file.name);
  if (!size.ok) return size;
  return ok({ src: dataUrl.value, width: size.value.width, height: size.value.height, name: file.name });
};

/** Fit an intrinsic size inside a box, preserving the aspect ratio. */
export const fitInside = (
  intrinsic: { readonly width: number; readonly height: number },
  box: { readonly width: number; readonly height: number },
): { readonly width: number; readonly height: number } => {
  const scale = Math.min(box.width / intrinsic.width, box.height / intrinsic.height, 1);
  const factor = scale > 0 ? scale : 1;
  return {
    width: Math.round(intrinsic.width * factor),
    height: Math.round(intrinsic.height * factor),
  };
};
