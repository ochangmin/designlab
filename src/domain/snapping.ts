/**
 * Alignment snapping during a drag.
 *
 * Candidates are the page's own edges and centre plus the bounds of every
 * element that is not being dragged. A snap reports both the correction to
 * apply and the guide to draw, so the overlay never re-derives why a drag
 * stopped where it did.
 */

import type { Rect } from './geometry.js';

export interface SnapGuide {
  readonly axis: 'x' | 'y';
  /** Position in page units along the guide's own axis. */
  readonly at: number;
  /** Extent along the other axis, so the guide is drawn only where it applies. */
  readonly from: number;
  readonly to: number;
}

export interface SnapOutcome {
  readonly dx: number;
  readonly dy: number;
  readonly guides: readonly SnapGuide[];
}

interface Candidate {
  readonly at: number;
  readonly from: number;
  readonly to: number;
}

const edgesX = (rect: Rect): readonly Candidate[] => [
  { at: rect.x, from: rect.y, to: rect.y + rect.height },
  { at: rect.x + rect.width / 2, from: rect.y, to: rect.y + rect.height },
  { at: rect.x + rect.width, from: rect.y, to: rect.y + rect.height },
];

const edgesY = (rect: Rect): readonly Candidate[] => [
  { at: rect.y, from: rect.x, to: rect.x + rect.width },
  { at: rect.y + rect.height / 2, from: rect.x, to: rect.x + rect.width },
  { at: rect.y + rect.height, from: rect.x, to: rect.x + rect.width },
];

const bestSnap = (
  moving: readonly Candidate[],
  targets: readonly Candidate[],
  threshold: number,
): { readonly offset: number; readonly guide: SnapGuide | null; } => {
  let bestDistance = threshold;
  let offset = 0;
  let winner: { readonly target: Candidate; readonly source: Candidate } | null = null;

  for (const source of moving) {
    for (const target of targets) {
      const distance = Math.abs(target.at - source.at);
      if (distance <= bestDistance) {
        bestDistance = distance;
        offset = target.at - source.at;
        winner = { target, source };
      }
    }
  }

  if (!winner) return { offset: 0, guide: null };
  return {
    offset,
    guide: {
      axis: 'x',
      at: winner.target.at,
      from: Math.min(winner.target.from, winner.source.from),
      to: Math.max(winner.target.to, winner.source.to),
    },
  };
};

export interface SnapRequest {
  /** Where the dragged selection would land with no snapping applied. */
  readonly moving: Rect;
  readonly others: readonly Rect[];
  readonly page: { readonly width: number; readonly height: number };
  /** In page units; callers divide a pixel threshold by the current zoom. */
  readonly threshold: number;
}

export const computeSnap = (request: SnapRequest): SnapOutcome => {
  const { moving, others, page, threshold } = request;
  const pageRect: Rect = { x: 0, y: 0, width: page.width, height: page.height };
  const targets = [pageRect, ...others];

  const targetsX = targets.flatMap(edgesX);
  const targetsY = targets.flatMap(edgesY);

  const horizontal = bestSnap(edgesX(moving), targetsX, threshold);
  const vertical = bestSnap(edgesY(moving), targetsY, threshold);

  const guides: SnapGuide[] = [];
  if (horizontal.guide) guides.push({ ...horizontal.guide, axis: 'x' });
  if (vertical.guide) guides.push({ ...vertical.guide, axis: 'y' });

  return { dx: horizontal.offset, dy: vertical.offset, guides };
};
