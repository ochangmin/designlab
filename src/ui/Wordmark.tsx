/**
 * The mark and the wordmark.
 *
 * Both are drawn from `BRAND`, so neither the shape nor the spelling of the
 * product name is written anywhere else in the interface.
 */

import type { ReactElement } from 'react';

import { BRAND } from './brand.js';

export interface WordmarkProps {
  /** Tile edge in px. The glyph is drawn on a 32-unit grid and scales with it. */
  readonly size?: number;
  /** False shows the mark alone, for tight spaces like the editor's top bar. */
  readonly withName?: boolean;
}

export const Wordmark = ({ size = 40, withName = true }: WordmarkProps): ReactElement => (
  <>
    <span
      className="brand__mark"
      aria-hidden="true"
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.3)}px` }}
    >
      <svg viewBox="0 0 32 32" width={size} height={size} focusable="false">
        <path d={BRAND.mark.glyph} fill={BRAND.palette.primaryInk} />
      </svg>
    </span>
    {withName && <span className="brand__name">{BRAND.wordmark}</span>}
  </>
);
