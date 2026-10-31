/**
 * The active brand, and the one place it reaches the page.
 *
 * `domain/brand.ts` holds the brands as data and stays pure; this adapter
 * picks the one this build wears and writes it onto the document as custom
 * properties. Every brand-bearing value in styles.css is one of these, so the
 * stylesheet never spells a brand colour and a merge changes no CSS.
 */

import { activeBrandId, brandOf, type Brand } from '../domain/brand.js';

export const BRAND: Brand = brandOf(activeBrandId(import.meta.env.VITE_BRAND));

/**
 * Applied before the first render so there is no frame in the previous
 * palette. The values in styles.css `:root` are the pre-script fallback;
 * these are authoritative.
 */
export const applyBrand = (brand: Brand = BRAND): void => {
  const root = document.documentElement;
  const { palette, type } = brand;

  const set = (name: string, value: string): void => root.style.setProperty(name, value);

  set('--ink', palette.ink);
  set('--ink-soft', palette.inkSoft);
  set('--ink-faint', palette.inkFaint);
  set('--line', palette.line);
  set('--line-strong', palette.lineStrong);
  set('--surface', palette.surface);
  set('--surface-sunken', palette.surfaceSunken);
  set('--surface-raised', palette.surface);
  set('--canvas', palette.workspace);
  set('--accent', palette.primary);
  set('--accent-ink', palette.primaryInk);
  set('--accent-soft', palette.primarySoft);
  set('--brand-deep', palette.deep);
  set('--brand-tile', brand.mark.tile);
  set('--brand-font', type.stack);
  set('--radius', `${type.radius}px`);

  root.dataset['brand'] = brand.id;
  document.title = brand.name;
};
