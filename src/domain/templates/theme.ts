/**
 * The vocabulary composed templates are written in.
 *
 * A layout describes an arrangement — where the headline sits, how wide the
 * body runs — and says nothing about colour or typeface. A theme supplies
 * those. One layout therefore yields as many templates as there are themes,
 * and each is a real design rather than a recolour, because the type scale
 * changes the family, the weight and the tracking along with the palette.
 *
 * Positions are written in `u`, hundredths of the page's shorter side, so a
 * layout holds its proportions whether it is drawn on a square post or an A4
 * sheet.
 */

import { createShape, createText } from '../elements.js';
import type { DesignElement, Paint, TextAlign } from '../document.js';

export interface Palette {
  readonly id: string;
  readonly label: string;
  readonly bg: Paint;
  /** A panel or card laid over the background. */
  readonly surface: string;
  readonly ink: string;
  readonly inkSoft: string;
  readonly accent: string;
  readonly accentSoft: string;
  readonly onAccent: string;
  /** True when the page is dark, so layouts can invert a panel. */
  readonly dark: boolean;
}

export interface TypeScale {
  readonly id: string;
  readonly label: string;
  readonly display: string;
  readonly body: string;
  readonly displayWeight: number;
  /** Tracking for display type, in units of the font size. */
  readonly displayTracking: number;
  readonly displayLineHeight: number;
  readonly uppercaseEyebrow: boolean;
}

export interface Theme {
  readonly palette: Palette;
  readonly type: TypeScale;
  readonly width: number;
  readonly height: number;
  /** Hundredths of the shorter side: the unit layouts are written in. */
  readonly u: (count: number) => number;
}

export const PALETTES: readonly Palette[] = [
  {
    id: 'midnight',
    label: '미드나잇',
    bg: { kind: 'gradient', from: '#0b1021', to: '#2a3568', angle: 150 },
    surface: '#161d3d',
    ink: '#ffffff',
    inkSoft: '#a5b4fc',
    accent: '#6d5efc',
    accentSoft: '#2f3b74',
    onAccent: '#ffffff',
    dark: true,
  },
  {
    id: 'sunset',
    label: '선셋',
    bg: { kind: 'gradient', from: '#2b1331', to: '#7a1f4f', angle: 140 },
    surface: '#3d1c3f',
    ink: '#ffffff',
    inkSoft: '#ffd9c2',
    accent: '#e2456b',
    accentSoft: '#5c2447',
    onAccent: '#ffffff',
    dark: true,
  },
  {
    id: 'paper',
    label: '페이퍼',
    bg: { kind: 'solid', color: '#fdfaf4' },
    surface: '#ffffff',
    ink: '#1b1b1f',
    inkSoft: '#6b6b73',
    accent: '#8a7a5c',
    accentSoft: '#e8dfcd',
    onAccent: '#ffffff',
    dark: false,
  },
  {
    id: 'mint',
    label: '민트',
    bg: { kind: 'solid', color: '#f1faf4' },
    surface: '#ffffff',
    ink: '#10231c',
    inkSoft: '#2f5c48',
    accent: '#3f9a6a',
    accentSoft: '#cfeadb',
    onAccent: '#ffffff',
    dark: false,
  },
  {
    id: 'mono',
    label: '모노',
    bg: { kind: 'solid', color: '#ffffff' },
    surface: '#f4f4f5',
    ink: '#111111',
    inkSoft: '#71717a',
    accent: '#111111',
    accentSoft: '#e4e4e7',
    onAccent: '#ffffff',
    dark: false,
  },
];

export const TYPE_SCALES: readonly TypeScale[] = [
  {
    id: 'sans',
    label: '산스',
    display: 'Montserrat',
    body: 'Noto Sans KR',
    displayWeight: 800,
    displayTracking: -0.03,
    displayLineHeight: 1.1,
    uppercaseEyebrow: true,
  },
  {
    id: 'serif',
    label: '세리프',
    display: 'Playfair Display',
    body: 'Gowun Batang',
    displayWeight: 700,
    displayTracking: -0.01,
    displayLineHeight: 1.22,
    uppercaseEyebrow: false,
  },
];

export const themeFor = (
  palette: Palette,
  type: TypeScale,
  width: number,
  height: number,
): Theme => ({
  palette,
  type,
  width,
  height,
  u: (count) => Math.round((Math.min(width, height) / 100) * count),
});

// ------------------------------------------------------------------ pieces

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface TextOptions {
  readonly align?: TextAlign;
  readonly color?: string;
  readonly opacity?: number;
  readonly rotation?: number;
}

/** The headline: the theme's display family, weight and tracking. */
export const display = (
  theme: Theme,
  text: string,
  box: Box,
  size: number,
  options: TextOptions = {},
): DesignElement =>
  createText(text, box, {
    fontFamily: theme.type.display,
    fontSize: size,
    fontWeight: theme.type.displayWeight,
    letterSpacing: Math.round(size * theme.type.displayTracking),
    lineHeight: theme.type.displayLineHeight,
    color: options.color ?? theme.palette.ink,
    ...(options.align === undefined ? {} : { align: options.align }),
    ...(options.rotation === undefined ? {} : { rotation: options.rotation }),
    ...(options.opacity === undefined ? {} : { opacity: options.opacity }),
  });

/** Running text, always in the body family. */
export const body = (
  theme: Theme,
  text: string,
  box: Box,
  size: number,
  options: TextOptions = {},
): DesignElement =>
  createText(text, box, {
    fontFamily: theme.type.body,
    fontSize: size,
    fontWeight: 400,
    lineHeight: 1.7,
    color: options.color ?? theme.palette.inkSoft,
    ...(options.align === undefined ? {} : { align: options.align }),
    ...(options.opacity === undefined ? {} : { opacity: options.opacity }),
  });

/** A small label above a headline. */
export const eyebrow = (
  theme: Theme,
  text: string,
  box: Box,
  size: number,
  options: TextOptions = {},
): DesignElement =>
  createText(text, box, {
    fontFamily: theme.type.uppercaseEyebrow ? 'Inter' : theme.type.body,
    fontSize: size,
    fontWeight: 700,
    letterSpacing: Math.round(size * 0.3),
    color: options.color ?? theme.palette.accent,
    uppercase: theme.type.uppercaseEyebrow,
    ...(options.align === undefined ? {} : { align: options.align }),
  });

/** Emphasis in the body family, for a name or a figure. */
export const label = (
  theme: Theme,
  text: string,
  box: Box,
  size: number,
  options: TextOptions = {},
): DesignElement =>
  createText(text, box, {
    fontFamily: theme.type.body,
    fontSize: size,
    fontWeight: 700,
    lineHeight: 1.4,
    color: options.color ?? theme.palette.ink,
    ...(options.align === undefined ? {} : { align: options.align }),
  });

/** A short rule, usually under a headline. */
export const bar = (theme: Theme, box: Box, color?: string): DesignElement =>
  createShape('rectangle', box, {
    fill: { kind: 'solid', color: color ?? theme.palette.accent },
    radius: Math.round(box.height / 2),
    name: '강조 막대',
  });

/** A filled panel the content sits on. */
export const panel = (theme: Theme, box: Box, radius: number, color?: string): DesignElement =>
  createShape('rectangle', box, {
    fill: { kind: 'solid', color: color ?? theme.palette.surface },
    radius,
    name: '패널',
  });

/** A soft shape set behind the content, for depth. */
export const blob = (theme: Theme, box: Box, opacity = 0.8): DesignElement =>
  createShape('ellipse', box, {
    fill: { kind: 'gradient', from: theme.palette.accent, to: theme.palette.inkSoft, angle: 135 },
    opacity,
    name: '장식',
  });

/** A call to action: a pill with its text, as two elements. */
export const button = (
  theme: Theme,
  text: string,
  box: Box,
  size: number,
): readonly DesignElement[] => [
  createShape('rectangle', box, {
    fill: { kind: 'solid', color: theme.palette.accent },
    radius: Math.round(box.height / 2),
    name: '버튼',
  }),
  createText(text, { ...box, y: Math.round(box.y + (box.height - size * 1.4) / 2), height: Math.round(size * 1.4) }, {
    fontFamily: theme.type.body,
    fontSize: size,
    fontWeight: 700,
    align: 'center',
    color: theme.palette.onAccent,
    name: '버튼 글자',
  }),
];

/** A hairline divider. */
export const rule = (theme: Theme, box: Box): DesignElement =>
  createShape('line', box, {
    stroke: { color: theme.palette.accentSoft, width: Math.max(2, Math.round(box.height)), dash: 0 },
    name: '구분선',
  });
