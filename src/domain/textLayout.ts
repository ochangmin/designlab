/**
 * Line breaking for text elements.
 *
 * The editor renders text with the browser's own layout, and export rasterises
 * it with Canvas 2D. Both read their lines from this module through an injected
 * `MeasureText` port, so a wrapped headline keeps the same break positions on
 * screen and in a PNG. Measurement is the only impure part and it stays at the
 * boundary.
 */

export interface FontSpec {
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly italic: boolean;
  readonly letterSpacing: number;
  /** Multiplier of the font size; owns the distance between baselines. */
  readonly lineHeight: number;
}

/** Advance width of `text` in page units for the given font. */
export type MeasureText = (text: string, font: FontSpec) => number;

export interface TextLayout {
  readonly lines: readonly string[];
  readonly lineHeightPx: number;
  readonly totalHeight: number;
  /** Width of the widest line, useful for auto-fitting a text box. */
  readonly maxLineWidth: number;
}

/** A CSS/Canvas font shorthand. One owner, so both renderers agree. */
export const toFontShorthand = (font: FontSpec): string =>
  `${font.italic ? 'italic ' : ''}${font.fontWeight} ${font.fontSize}px ${JSON.stringify(font.fontFamily)}, system-ui, sans-serif`;

// Characters that may start a line even without a preceding space. CJK text has
// no spaces, so a greedy word pass alone would never wrap it.
const isBreakable = (character: string): boolean =>
  /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/.test(character);

const splitIntoTokens = (line: string): readonly string[] => {
  const tokens: string[] = [];
  let current = '';
  for (const character of line) {
    if (character === ' ') {
      current += character;
      tokens.push(current);
      current = '';
      continue;
    }
    if (isBreakable(character)) {
      if (current) tokens.push(current);
      tokens.push(character);
      current = '';
      continue;
    }
    current += character;
  }
  if (current) tokens.push(current);
  return tokens;
};

const breakLongToken = (
  token: string,
  maxWidth: number,
  font: FontSpec,
  measure: MeasureText,
): readonly string[] => {
  const parts: string[] = [];
  let current = '';
  for (const character of token) {
    const candidate = current + character;
    if (current !== '' && measure(candidate, font) > maxWidth) {
      parts.push(current);
      current = character;
      continue;
    }
    current = candidate;
  }
  if (current) parts.push(current);
  return parts;
};

export const layoutText = (
  text: string,
  maxWidth: number,
  font: FontSpec,
  measure: MeasureText,
): TextLayout => {
  const width = Math.max(1, maxWidth);
  const lines: string[] = [];

  for (const paragraph of text.split('\n')) {
    if (paragraph === '') {
      lines.push('');
      continue;
    }
    let current = '';
    for (const token of splitIntoTokens(paragraph)) {
      const candidate = current + token;
      if (current !== '' && measure(candidate.trimEnd(), font) > width) {
        lines.push(current.trimEnd());
        current = token.trimStart() === '' ? '' : token;
      } else {
        current = candidate;
      }
      if (current !== '' && measure(current.trimEnd(), font) > width) {
        const parts = breakLongToken(current, width, font, measure);
        const tail = parts[parts.length - 1] ?? '';
        for (const part of parts.slice(0, -1)) lines.push(part);
        current = tail;
      }
    }
    lines.push(current.trimEnd());
  }

  const lineHeightPx = font.fontSize * font.lineHeight;
  const widths = lines.map((line) => measure(line, font));
  return {
    lines,
    lineHeightPx,
    totalHeight: lines.length * lineHeightPx,
    maxLineWidth: widths.length === 0 ? 0 : Math.max(...widths),
  };
};

/** A measure port backed by a 2D canvas. Created once and reused. */
export const createCanvasMeasure = (): MeasureText => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const cache = new Map<string, number>();
  return (text, font) => {
    if (!context) return text.length * font.fontSize * 0.5;
    const key = `${font.fontFamily}|${font.fontSize}|${font.fontWeight}|${String(font.italic)}|${font.letterSpacing}|${text}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    context.font = toFontShorthand(font);
    const width = context.measureText(text).width + font.letterSpacing * Math.max(0, text.length - 1);
    if (cache.size > 4000) cache.clear();
    cache.set(key, width);
    return width;
  };
};
