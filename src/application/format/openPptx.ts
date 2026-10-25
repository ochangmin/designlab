/**
 * Opening a `.pptx` as a DesignLab document.
 *
 * This is the workflow the UI calls: it owns the order of the steps and the
 * lifetime of the opened package, and it is the only place where the engine
 * and the mapping meet. The mapping itself stays pure in
 * `domain/pptxImport.ts`; the engine stays behind `craftEngine.ts`.
 */

import { designFromPresentation, type ImportOutcome } from '../../domain/pptxImport.js';
import type { StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';
import { loadCraftEngine } from './craftEngine.js';

/** Beyond this a package is more likely a mistake than a slide deck. */
const MAX_BYTES = 64 * 1024 * 1024;

const BASE64_CHUNK = 0x8000;

/** A data URL for bytes the browser will treat as an image. */
const toDataUrl = (bytes: Uint8Array, contentType: string): string => {
  // btoa takes a string, and spreading megabytes into one call overflows the
  // argument limit, so the bytes are folded in chunks.
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK));
  }
  return `data:${contentType || 'image/png'};base64,${btoa(binary)}`;
};

const mediaTypesOf = (model: unknown): readonly string[] => {
  if (typeof model !== 'object' || model === null) return [];
  const media = (model as Record<string, unknown>)['media'];
  if (!Array.isArray(media)) return [];
  return media.map((item) => {
    if (typeof item !== 'object' || item === null) return 'image/png';
    const type = (item as Record<string, unknown>)['contentType'];
    return typeof type === 'string' && type !== '' ? type : 'image/png';
  });
};

const designNameFrom = (fileName: string): string => {
  const withoutExtension = fileName.replace(/\.pptx?$/i, '').trim();
  return withoutExtension === '' ? '가져온 프레젠테이션' : withoutExtension;
};

export const openPptxFile = async (file: File): Promise<Result<ImportOutcome, StudioError>> => {
  if (file.size > MAX_BYTES) {
    return err({
      kind: 'asset-too-large',
      fileName: file.name,
      bytes: file.size,
      limitBytes: MAX_BYTES,
    });
  }

  const engine = await loadCraftEngine();
  if (!engine.ok) return engine;

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!engine.value.sniffPptx(bytes)) {
    return err({
      kind: 'import-failed',
      format: 'PPTX',
      detail: 'PowerPoint 파일 형식이 아닙니다.',
    });
  }
  if (engine.value.isPptxEncrypted(bytes)) {
    return err({
      kind: 'import-failed',
      format: 'PPTX',
      detail: '암호로 보호된 파일은 열 수 없습니다. PowerPoint에서 암호를 해제한 뒤 다시 시도해 주세요.',
    });
  }

  const opened = engine.value.openPptx(bytes);
  if (!opened.ok) return opened;

  try {
    const types = mediaTypesOf(opened.value.model);
    // Decoded lazily and once per item: a deck can carry the same picture on
    // several slides, and base64 of a large photo is not cheap.
    const urls = new Map<number, string | null>();
    const mediaUrl = (index: number): string | null => {
      const cached = urls.get(index);
      if (cached !== undefined) return cached;
      const raw = opened.value.mediaBytes(index);
      const url = raw === null ? null : toDataUrl(raw, types[index] ?? 'image/png');
      urls.set(index, url);
      return url;
    };

    const mapped = designFromPresentation({
      model: opened.value.model,
      mediaUrl,
      name: designNameFrom(file.name),
    });
    if (!mapped.ok) return mapped;

    // The reader's own warnings come first: they describe the file, while the
    // mapping's notes describe what this editor could not represent.
    return ok({
      design: mapped.value.design,
      notes: [...opened.value.warnings, ...mapped.value.notes],
    });
  } finally {
    opened.value.release();
  }
};
