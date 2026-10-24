import { describe, expect, it } from 'vitest';

import { boundsOf, cornersOf, resizeRect, rotatePoint, type Rect } from '../src/domain/geometry.js';

const box: Rect = { x: 100, y: 100, width: 200, height: 100 };

describe('boundsOf', () => {
  it('returns the box itself when unrotated', () => {
    expect(boundsOf(box, 0)).toEqual(box);
  });

  it('grows to contain a rotated box', () => {
    const bounds = boundsOf(box, 90);
    expect(Math.round(bounds.width)).toBe(100);
    expect(Math.round(bounds.height)).toBe(200);
    // Rotation is about the centre, so the centre is preserved.
    expect(Math.round(bounds.x + bounds.width / 2)).toBe(200);
    expect(Math.round(bounds.y + bounds.height / 2)).toBe(150);
  });
});

describe('resizeRect', () => {
  it('keeps the opposite edge fixed when dragging east', () => {
    const next = resizeRect({
      rect: box,
      rotation: 0,
      handle: 'e',
      delta: { x: 40, y: 0 },
      keepAspect: false,
      minSize: 8,
    });
    expect(next.x).toBe(100);
    expect(next.width).toBe(240);
    expect(next.height).toBe(100);
  });

  it('moves the origin when dragging the north-west handle', () => {
    const next = resizeRect({
      rect: box,
      rotation: 0,
      handle: 'nw',
      delta: { x: -20, y: -10 },
      keepAspect: false,
      minSize: 8,
    });
    expect(next.x).toBe(80);
    expect(next.y).toBe(90);
    expect(next.width).toBe(220);
    expect(next.height).toBe(110);
  });

  it('enforces the minimum size instead of inverting the box', () => {
    const next = resizeRect({
      rect: box,
      rotation: 0,
      handle: 'e',
      delta: { x: -5000, y: 0 },
      keepAspect: false,
      minSize: 12,
    });
    expect(next.width).toBe(12);
  });

  it('holds the anchor corner in page space for a rotated box', () => {
    const rotation = 30;
    const anchorBefore = cornersOf(box, rotation)[0];
    const next = resizeRect({
      rect: box,
      rotation,
      handle: 'se',
      delta: { x: 60, y: 25 },
      keepAspect: false,
      minSize: 8,
    });
    const anchorAfter = cornersOf(next, rotation)[0];
    expect(anchorBefore).toBeDefined();
    expect(anchorAfter).toBeDefined();
    expect(Math.abs((anchorAfter?.x ?? 0) - (anchorBefore?.x ?? 0))).toBeLessThan(0.5);
    expect(Math.abs((anchorAfter?.y ?? 0) - (anchorBefore?.y ?? 0))).toBeLessThan(0.5);
  });

  it('preserves the aspect ratio on a corner drag when asked', () => {
    const next = resizeRect({
      rect: box,
      rotation: 0,
      handle: 'se',
      delta: { x: 100, y: 0 },
      keepAspect: true,
      minSize: 8,
    });
    expect(next.width / next.height).toBeCloseTo(box.width / box.height, 3);
  });
});

describe('rotatePoint', () => {
  it('is a no-op at zero degrees', () => {
    const point = { x: 3, y: 7 };
    expect(rotatePoint(point, { x: 0, y: 0 }, 0)).toBe(point);
  });

  it('rotates a quarter turn about the origin', () => {
    const rotated = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
    expect(Math.round(rotated.x)).toBe(0);
    expect(Math.round(rotated.y)).toBe(10);
  });
});
