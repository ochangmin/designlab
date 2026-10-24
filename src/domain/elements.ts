/**
 * Element factories and defaults.
 *
 * Creation lives here so that a template, a drag from the sidebar and a paste
 * all produce the same fully-populated element. Every field is required in the
 * model, so no consumer has to guess a default later.
 */

import { createId } from './ids.js';
import type {
  DesignElement,
  IconElement,
  ImageElement,
  ImageFilters,
  Paint,
  Shadow,
  ShapeElement,
  ShapeKind,
  Stroke,
  TextAlign,
  TextElement,
} from './document.js';

export const NO_SHADOW: Shadow = {
  enabled: false,
  color: 'rgba(17, 24, 39, 0.28)',
  blur: 24,
  offsetX: 0,
  offsetY: 12,
};

export const NEUTRAL_FILTERS: ImageFilters = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  grayscale: 0,
};

export const NO_STROKE: Stroke = { color: '#111827', width: 0, dash: 0 };

const base = (name: string, x: number, y: number, width: number, height: number) => ({
  name,
  x,
  y,
  width,
  height,
  rotation: 0,
  opacity: 1,
  locked: false,
  hidden: false,
  groupId: null,
  shadow: NO_SHADOW,
});

export const SHAPE_LABELS: Readonly<Record<ShapeKind, string>> = {
  rectangle: '사각형',
  ellipse: '원',
  triangle: '삼각형',
  diamond: '다이아몬드',
  pentagon: '오각형',
  hexagon: '육각형',
  star: '별',
  arrow: '화살표',
  line: '선',
  speech: '말풍선',
};

export interface ShapeOverrides {
  readonly fill?: Paint;
  readonly stroke?: Stroke;
  readonly radius?: number;
  readonly rotation?: number;
  readonly opacity?: number;
  readonly shadow?: Shadow;
  readonly name?: string;
}

export const createShape = (
  shape: ShapeKind,
  rect: { x: number; y: number; width: number; height: number },
  overrides: ShapeOverrides = {},
): ShapeElement => ({
  ...base(overrides.name ?? SHAPE_LABELS[shape], rect.x, rect.y, rect.width, rect.height),
  id: createId('el'),
  type: 'shape',
  shape,
  fill: overrides.fill ?? { kind: 'solid', color: '#6d5efc' },
  stroke: overrides.stroke ?? (shape === 'line' ? { color: '#111827', width: 4, dash: 0 } : NO_STROKE),
  radius: overrides.radius ?? (shape === 'rectangle' ? 12 : 0),
  ...(overrides.rotation === undefined ? {} : { rotation: overrides.rotation }),
  ...(overrides.opacity === undefined ? {} : { opacity: overrides.opacity }),
  ...(overrides.shadow === undefined ? {} : { shadow: overrides.shadow }),
});

export interface TextOverrides {
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontWeight?: number;
  readonly color?: string;
  readonly align?: TextAlign;
  readonly lineHeight?: number;
  readonly letterSpacing?: number;
  readonly italic?: boolean;
  readonly underline?: boolean;
  readonly uppercase?: boolean;
  readonly rotation?: number;
  readonly opacity?: number;
  readonly shadow?: Shadow;
  readonly name?: string;
}

export const createText = (
  text: string,
  rect: { x: number; y: number; width: number; height: number },
  overrides: TextOverrides = {},
): TextElement => ({
  ...base(overrides.name ?? text.split('\n')[0]?.slice(0, 24) ?? '텍스트', rect.x, rect.y, rect.width, rect.height),
  id: createId('el'),
  type: 'text',
  text,
  fontFamily: overrides.fontFamily ?? 'Inter',
  fontSize: overrides.fontSize ?? 48,
  fontWeight: overrides.fontWeight ?? 600,
  italic: overrides.italic ?? false,
  underline: overrides.underline ?? false,
  color: overrides.color ?? '#111827',
  align: overrides.align ?? 'left',
  lineHeight: overrides.lineHeight ?? 1.25,
  letterSpacing: overrides.letterSpacing ?? 0,
  uppercase: overrides.uppercase ?? false,
  ...(overrides.rotation === undefined ? {} : { rotation: overrides.rotation }),
  ...(overrides.opacity === undefined ? {} : { opacity: overrides.opacity }),
  ...(overrides.shadow === undefined ? {} : { shadow: overrides.shadow }),
});

export interface ImageOverrides {
  readonly fit?: ImageElement['fit'];
  readonly radius?: number;
  readonly filters?: ImageFilters;
  readonly rotation?: number;
  readonly opacity?: number;
  readonly shadow?: Shadow;
  readonly name?: string;
}

export const createImage = (
  src: string,
  rect: { x: number; y: number; width: number; height: number },
  overrides: ImageOverrides = {},
): ImageElement => ({
  ...base(overrides.name ?? '이미지', rect.x, rect.y, rect.width, rect.height),
  id: createId('el'),
  type: 'image',
  src,
  fit: overrides.fit ?? 'cover',
  radius: overrides.radius ?? 0,
  filters: overrides.filters ?? NEUTRAL_FILTERS,
  ...(overrides.rotation === undefined ? {} : { rotation: overrides.rotation }),
  ...(overrides.opacity === undefined ? {} : { opacity: overrides.opacity }),
  ...(overrides.shadow === undefined ? {} : { shadow: overrides.shadow }),
});

export interface IconOverrides {
  readonly color?: string;
  readonly rotation?: number;
  readonly opacity?: number;
  readonly shadow?: Shadow;
}

export const createIcon = (
  name: string,
  pathData: string,
  rect: { x: number; y: number; width: number; height: number },
  overrides: IconOverrides = {},
): IconElement => ({
  ...base(name, rect.x, rect.y, rect.width, rect.height),
  id: createId('el'),
  type: 'icon',
  pathData,
  viewBox: 24,
  color: overrides.color ?? '#111827',
  ...(overrides.rotation === undefined ? {} : { rotation: overrides.rotation }),
  ...(overrides.opacity === undefined ? {} : { opacity: overrides.opacity }),
  ...(overrides.shadow === undefined ? {} : { shadow: overrides.shadow }),
});

/** A copy with fresh identity. Group membership is remapped by the caller. */
export const cloneElement = (element: DesignElement): DesignElement => ({
  ...element,
  id: createId('el'),
});

export const ELEMENT_TYPE_LABELS: Readonly<Record<DesignElement['type'], string>> = {
  shape: '도형',
  text: '텍스트',
  image: '이미지',
  icon: '아이콘',
};
