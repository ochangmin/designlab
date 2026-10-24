import type { CSSProperties } from 'react';

/**
 * Pass CSS custom properties through React's `style` prop.
 *
 * `CSSProperties` has no index signature, so a `--x` key needs one cast. Doing
 * it here keeps the cast in a single place instead of at every call site.
 */
export const cssVars = (vars: Readonly<Record<string, string | number>>): CSSProperties =>
  vars as CSSProperties;
