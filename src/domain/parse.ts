/**
 * The one boundary that turns unknown JSON into a `Design`.
 *
 * Stored projects and imported files are both parsed here, so a malformed
 * document is reported once with the path where the parse stopped, and no
 * consumer downstream has to defend against a half-built element.
 */

import { err, ok, type Result } from './result.js';
import type { DocumentMalformed } from './errors.js';
import { NEUTRAL_FILTERS, NO_SHADOW, NO_STROKE } from './elements.js';
import {
  SCHEMA_VERSION,
  type Design,
  type DesignElement,
  type ImageFilters,
  type Page,
  type Paint,
  type Shadow,
  type ShapeKind,
  type Stroke,
  type TextAlign,
} from './document.js';

type Json = Record<string, unknown>;

const fail = (at: string, detail: string): Result<never, DocumentMalformed> =>
  err({ kind: 'document-malformed', at, detail });

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const num = (source: Json, key: string, fallback: number): number => {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const str = (source: Json, key: string, fallback: string): string => {
  const value = source[key];
  return typeof value === 'string' ? value : fallback;
};

const bool = (source: Json, key: string, fallback: boolean): boolean => {
  const value = source[key];
  return typeof value === 'boolean' ? value : fallback;
};

const parsePaint = (value: unknown, fallback: Paint): Paint => {
  if (!isRecord(value)) return fallback;
  const kind = value['kind'];
  if (kind === 'none') return { kind: 'none' };
  if (kind === 'solid') return { kind: 'solid', color: str(value, 'color', '#ffffff') };
  if (kind === 'gradient') {
    return {
      kind: 'gradient',
      from: str(value, 'from', '#6d5efc'),
      to: str(value, 'to', '#f472b6'),
      angle: num(value, 'angle', 135),
    };
  }
  return fallback;
};

const parseShadow = (value: unknown): Shadow => {
  if (!isRecord(value)) return NO_SHADOW;
  return {
    enabled: bool(value, 'enabled', false),
    color: str(value, 'color', NO_SHADOW.color),
    blur: num(value, 'blur', NO_SHADOW.blur),
    offsetX: num(value, 'offsetX', NO_SHADOW.offsetX),
    offsetY: num(value, 'offsetY', NO_SHADOW.offsetY),
  };
};

const parseStroke = (value: unknown): Stroke => {
  if (!isRecord(value)) return NO_STROKE;
  return {
    color: str(value, 'color', NO_STROKE.color),
    width: num(value, 'width', 0),
    dash: num(value, 'dash', 0),
  };
};

const parseFilters = (value: unknown): ImageFilters => {
  if (!isRecord(value)) return NEUTRAL_FILTERS;
  return {
    brightness: num(value, 'brightness', 100),
    contrast: num(value, 'contrast', 100),
    saturate: num(value, 'saturate', 100),
    blur: num(value, 'blur', 0),
    grayscale: num(value, 'grayscale', 0),
  };
};

const SHAPE_KINDS: readonly ShapeKind[] = [
  'rectangle',
  'ellipse',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'star',
  'arrow',
  'line',
  'speech',
];

const ALIGNMENTS: readonly TextAlign[] = ['left', 'center', 'right'];

const parseElement = (value: unknown, at: string): Result<DesignElement, DocumentMalformed> => {
  if (!isRecord(value)) return fail(at, '요소가 객체가 아닙니다.');
  const id = str(value, 'id', '');
  if (id === '') return fail(`${at}.id`, '요소 id가 없습니다.');

  const base = {
    id,
    name: str(value, 'name', '요소'),
    x: num(value, 'x', 0),
    y: num(value, 'y', 0),
    width: Math.max(1, num(value, 'width', 100)),
    height: Math.max(1, num(value, 'height', 100)),
    rotation: num(value, 'rotation', 0),
    opacity: Math.max(0, Math.min(1, num(value, 'opacity', 1))),
    locked: bool(value, 'locked', false),
    hidden: bool(value, 'hidden', false),
    groupId: typeof value['groupId'] === 'string' ? value['groupId'] : null,
    shadow: parseShadow(value['shadow']),
  };

  const type = value['type'];
  if (type === 'shape') {
    const shape = value['shape'];
    if (typeof shape !== 'string' || !SHAPE_KINDS.includes(shape as ShapeKind)) {
      return fail(`${at}.shape`, `알 수 없는 도형: ${String(shape)}`);
    }
    return ok({
      ...base,
      type: 'shape',
      shape: shape as ShapeKind,
      fill: parsePaint(value['fill'], { kind: 'solid', color: '#6d5efc' }),
      stroke: parseStroke(value['stroke']),
      radius: num(value, 'radius', 0),
    });
  }

  if (type === 'text') {
    const align = value['align'];
    return ok({
      ...base,
      type: 'text',
      text: str(value, 'text', ''),
      fontFamily: str(value, 'fontFamily', 'Inter'),
      fontSize: Math.max(1, num(value, 'fontSize', 48)),
      fontWeight: num(value, 'fontWeight', 600),
      italic: bool(value, 'italic', false),
      underline: bool(value, 'underline', false),
      color: str(value, 'color', '#111827'),
      align: typeof align === 'string' && ALIGNMENTS.includes(align as TextAlign) ? (align as TextAlign) : 'left',
      lineHeight: num(value, 'lineHeight', 1.25),
      letterSpacing: num(value, 'letterSpacing', 0),
      uppercase: bool(value, 'uppercase', false),
    });
  }

  if (type === 'image') {
    const src = value['src'];
    if (typeof src !== 'string' || src === '') return fail(`${at}.src`, '이미지 소스가 없습니다.');
    const fit = value['fit'];
    return ok({
      ...base,
      type: 'image',
      src,
      fit: fit === 'contain' || fit === 'fill' ? fit : 'cover',
      radius: num(value, 'radius', 0),
      filters: parseFilters(value['filters']),
    });
  }

  if (type === 'icon') {
    const pathData = value['pathData'];
    if (typeof pathData !== 'string' || pathData === '') return fail(`${at}.pathData`, '아이콘 경로가 없습니다.');
    return ok({
      ...base,
      type: 'icon',
      pathData,
      viewBox: num(value, 'viewBox', 24),
      color: str(value, 'color', '#111827'),
    });
  }

  return fail(`${at}.type`, `알 수 없는 요소 종류: ${String(type)}`);
};

const parsePage = (value: unknown, at: string): Result<Page, DocumentMalformed> => {
  if (!isRecord(value)) return fail(at, '페이지가 객체가 아닙니다.');
  const id = str(value, 'id', '');
  if (id === '') return fail(`${at}.id`, '페이지 id가 없습니다.');
  const rawElements = value['elements'];
  if (!Array.isArray(rawElements)) return fail(`${at}.elements`, '요소 목록이 배열이 아닙니다.');

  const elements: DesignElement[] = [];
  for (const [index, raw] of rawElements.entries()) {
    const parsed = parseElement(raw, `${at}.elements[${index}]`);
    if (!parsed.ok) return parsed;
    elements.push(parsed.value);
  }

  return ok({
    id,
    name: str(value, 'name', '페이지'),
    background: parsePaint(value['background'], { kind: 'solid', color: '#ffffff' }),
    elements,
  });
};

export const parseDesign = (value: unknown): Result<Design, DocumentMalformed> => {
  if (!isRecord(value)) return fail('$', '문서가 객체가 아닙니다.');
  const id = str(value, 'id', '');
  if (id === '') return fail('$.id', '디자인 id가 없습니다.');
  const rawPages = value['pages'];
  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    return fail('$.pages', '페이지가 하나도 없습니다.');
  }

  const pages: Page[] = [];
  for (const [index, raw] of rawPages.entries()) {
    const parsed = parsePage(raw, `$.pages[${index}]`);
    if (!parsed.ok) return parsed;
    pages.push(parsed.value);
  }

  const rawPalette = value['palette'];
  const palette = Array.isArray(rawPalette)
    ? rawPalette.filter((entry): entry is string => typeof entry === 'string')
    : [];

  const now = Date.now();
  return ok({
    id,
    schemaVersion: num(value, 'schemaVersion', SCHEMA_VERSION),
    name: str(value, 'name', '제목 없는 디자인'),
    width: Math.max(1, num(value, 'width', 1080)),
    height: Math.max(1, num(value, 'height', 1080)),
    pages,
    palette,
    createdAt: num(value, 'createdAt', now),
    updatedAt: num(value, 'updatedAt', now),
  });
};

/** Parse text that is expected to hold a design document. */
export const parseDesignJson = (text: string): Result<Design, DocumentMalformed> => {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (cause) {
    return fail('$', cause instanceof Error ? cause.message : 'JSON 구문 오류');
  }
  return parseDesign(value);
};
