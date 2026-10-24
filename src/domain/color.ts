/**
 * Colour parsing and formatting.
 *
 * Stored documents keep the author's own string. Rendering and contrast
 * decisions go through a parsed form here, and an unparseable value stays
 * unknown (`null`) instead of being silently replaced with black.
 */

export interface Rgba {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const HEX_SHORT = /^#([0-9a-f]{3,4})$/i;
const HEX_LONG = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_FUNC = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)$/i;

const parseAlpha = (raw: string | undefined): number => {
  if (raw === undefined) return 1;
  if (raw.endsWith('%')) {
    const percent = Number.parseFloat(raw.slice(0, -1));
    return Number.isFinite(percent) ? percent / 100 : 1;
  }
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : 1;
};

export const parseColor = (input: string): Rgba | null => {
  const value = input.trim();

  const short = HEX_SHORT.exec(value);
  if (short?.[1]) {
    const digits = short[1];
    const channel = (index: number): number => {
      const digit = digits[index] ?? '0';
      return Number.parseInt(`${digit}${digit}`, 16);
    };
    return {
      r: channel(0),
      g: channel(1),
      b: channel(2),
      a: digits.length === 4 ? channel(3) / 255 : 1,
    };
  }

  const long = HEX_LONG.exec(value);
  if (long?.[1]) {
    const digits = long[1];
    const channel = (index: number): number => Number.parseInt(digits.slice(index, index + 2), 16);
    return {
      r: channel(0),
      g: channel(2),
      b: channel(4),
      a: digits.length === 8 ? channel(6) / 255 : 1,
    };
  }

  const func = RGB_FUNC.exec(value);
  if (func) {
    return {
      r: Math.round(Number.parseFloat(func[1] ?? '0')),
      g: Math.round(Number.parseFloat(func[2] ?? '0')),
      b: Math.round(Number.parseFloat(func[3] ?? '0')),
      a: parseAlpha(func[4]),
    };
  }

  return null;
};

const toHexPair = (channel: number): string =>
  Math.round(Math.max(0, Math.min(255, channel)))
    .toString(16)
    .padStart(2, '0');

export const toHex = (color: Rgba): string => `#${toHexPair(color.r)}${toHexPair(color.g)}${toHexPair(color.b)}`;

export const toCss = (color: Rgba): string =>
  color.a >= 1
    ? toHex(color)
    : `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${Number(color.a.toFixed(3))})`;

export const withAlpha = (input: string, alpha: number): string => {
  const parsed = parseColor(input);
  if (!parsed) return input;
  return toCss({ ...parsed, a: Math.max(0, Math.min(1, alpha)) });
};

/** Relative luminance per WCAG 2.1, used to pick readable overlay text. */
export const luminance = (color: Rgba): number => {
  const channel = (raw: number): number => {
    const scaled = raw / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
};

/** Black or white, whichever reads better on the given background. */
export const readableInkFor = (background: string): string => {
  const parsed = parseColor(background);
  if (!parsed) return '#1b1b1f';
  return luminance(parsed) > 0.45 ? '#1b1b1f' : '#ffffff';
};

export const mix = (from: string, to: string, ratio: number): string => {
  const a = parseColor(from);
  const b = parseColor(to);
  if (!a || !b) return from;
  const blend = (left: number, right: number): number => left + (right - left) * ratio;
  return toCss({
    r: blend(a.r, b.r),
    g: blend(a.g, b.g),
    b: blend(a.b, b.b),
    a: blend(a.a, b.a),
  });
};
