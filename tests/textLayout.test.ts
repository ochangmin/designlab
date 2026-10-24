import { describe, expect, it } from 'vitest';

import { layoutText, toFontShorthand, type FontSpec, type MeasureText } from '../src/domain/textLayout.js';

/** A deterministic stand-in for canvas metrics: every glyph is half an em. */
const measure: MeasureText = (text, font) => text.length * font.fontSize * 0.5;

const font: FontSpec = {
  fontFamily: 'Inter',
  fontSize: 20,
  fontWeight: 400,
  italic: false,
  letterSpacing: 0,
  lineHeight: 1.5,
};

describe('layoutText', () => {
  it('keeps a short line intact', () => {
    const layout = layoutText('hello', 400, font, measure);
    expect(layout.lines).toEqual(['hello']);
    expect(layout.lineHeightPx).toBe(30);
    expect(layout.totalHeight).toBe(30);
  });

  it('wraps on word boundaries', () => {
    const layout = layoutText('one two three four', 70, font, measure);
    expect(layout.lines.length).toBeGreaterThan(1);
    for (const line of layout.lines) {
      expect(measure(line, font)).toBeLessThanOrEqual(70);
    }
  });

  it('preserves explicit newlines, including empty paragraphs', () => {
    const layout = layoutText('a\n\nb', 400, font, measure);
    expect(layout.lines).toEqual(['a', '', 'b']);
  });

  it('wraps Korean text that has no spaces', () => {
    const layout = layoutText('가나다라마바사아자차', 60, font, measure);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join('')).toBe('가나다라마바사아자차');
  });

  it('breaks a single word that cannot fit', () => {
    const layout = layoutText('abcdefghij', 30, font, measure);
    expect(layout.lines.length).toBeGreaterThan(1);
    expect(layout.lines.join('')).toBe('abcdefghij');
  });

  it('reports the widest line', () => {
    const layout = layoutText('ab\nabcd', 400, font, measure);
    expect(layout.maxLineWidth).toBe(40);
  });
});

describe('toFontShorthand', () => {
  it('quotes the family and includes the weight', () => {
    expect(toFontShorthand(font)).toContain('400 20px "Inter"');
  });

  it('marks italics', () => {
    expect(toFontShorthand({ ...font, italic: true }).startsWith('italic ')).toBe(true);
  });
});
