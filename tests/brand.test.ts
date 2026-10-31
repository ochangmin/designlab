import { describe, expect, it } from 'vitest';

import { activeBrandId, BRANDS, brandOf, type Brand } from '../src/domain/brand.js';

const ALL: readonly Brand[] = Object.values(BRANDS);

const HEX = /^#[0-9a-f]{6}$/;

describe('activeBrandId', () => {
  it('stands alone by default', () => {
    expect(activeBrandId(undefined)).toBe('studio');
    expect(activeBrandId('')).toBe('studio');
  });

  it('switches to the house brand on request', () => {
    expect(activeBrandId('bipko')).toBe('bipko');
  });

  it('keeps the default for an unknown value rather than failing the build', () => {
    expect(activeBrandId('bipko ')).toBe('studio');
    expect(activeBrandId('BIPKO')).toBe('studio');
    expect(activeBrandId('nonsense')).toBe('studio');
  });
});

describe('every brand', () => {
  it('is reachable by its own id', () => {
    for (const brand of ALL) expect(brandOf(brand.id)).toBe(brand);
  });

  it('names itself and says what it is', () => {
    for (const brand of ALL) {
      expect(brand.name.trim()).not.toBe('');
      expect(brand.wordmark.trim()).not.toBe('');
      expect(brand.description.trim()).not.toBe('');
    }
  });

  it('breaks its headline into lines rather than encoding them in a string', () => {
    for (const brand of ALL) {
      expect(brand.tagline.length).toBeGreaterThan(0);
      for (const line of brand.tagline) expect(line).not.toContain('\n');
    }
  });

  it('carries a complete palette of plain hex colours', () => {
    for (const brand of ALL) {
      for (const [name, value] of Object.entries(brand.palette)) {
        expect(HEX.test(value), `${brand.id}.${name} = ${value}`).toBe(true);
      }
    }
  });

  it('draws its mark on the 32-unit grid it declares', () => {
    for (const brand of ALL) {
      expect(brand.mark.glyph.startsWith('M')).toBe(true);
      expect(brand.mark.tile).toContain('gradient');
    }
  });

  it('uses the same typeface stack as bipko.ai, Korean fallback included', () => {
    for (const brand of ALL) {
      expect(brand.type.stack.startsWith('Inter')).toBe(true);
      expect(brand.type.stack).toContain('Noto Sans KR');
    }
  });
});

describe('the merge target', () => {
  // The point of the second brand is that joining bipko.ai is a switch, not a
  // redesign: both wear the same palette and type, and only the naming differs.
  it('shares the palette and type with the standalone brand', () => {
    expect(BRANDS.bipko.palette).toEqual(BRANDS.studio.palette);
    expect(BRANDS.bipko.type).toEqual(BRANDS.studio.type);
  });

  it('stops naming itself as a separate product', () => {
    expect(BRANDS.studio.house).toBe('BIPKO');
    expect(BRANDS.bipko.house).toBeNull();
    expect(BRANDS.bipko.wordmark).toBe('BIPKO');
  });
});
