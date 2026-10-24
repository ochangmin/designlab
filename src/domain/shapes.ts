/**
 * Shape outlines.
 *
 * One function turns a `ShapeKind` and a size into SVG path data. The editor
 * renders it in an inline `<svg>`, SVG export writes it verbatim, and the
 * raster exporter feeds the same string to `Path2D`. A shape therefore cannot
 * look different in the three places it is drawn.
 */

import type { ShapeKind } from './document.js';

const polygonPath = (points: readonly (readonly [number, number])[], width: number, height: number): string => {
  const scaled = points.map(([x, y]) => `${(x * width).toFixed(2)} ${(y * height).toFixed(2)}`);
  return `M ${scaled.join(' L ')} Z`;
};

const regularPolygon = (sides: number, rotationTurns = -0.25): readonly (readonly [number, number])[] =>
  Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides + rotationTurns) * Math.PI * 2;
    return [0.5 + 0.5 * Math.cos(angle), 0.5 + 0.5 * Math.sin(angle)] as const;
  });

const starPoints = (points: number, innerRatio: number): readonly (readonly [number, number])[] =>
  Array.from({ length: points * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? 0.5 : 0.5 * innerRatio;
    const angle = (index / (points * 2) - 0.25) * Math.PI * 2;
    return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)] as const;
  });

const roundedRectPath = (width: number, height: number, radius: number): string => {
  const r = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
  if (r === 0) return `M 0 0 H ${width} V ${height} H 0 Z`;
  return [
    `M ${r} 0`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `V ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
};

const ellipsePath = (width: number, height: number): string => {
  const rx = width / 2;
  const ry = height / 2;
  return `M 0 ${ry} A ${rx} ${ry} 0 0 1 ${width} ${ry} A ${rx} ${ry} 0 0 1 0 ${ry} Z`;
};

/** Path data in the element's own pixel space, origin at its top-left. */
export const shapePath = (shape: ShapeKind, width: number, height: number, radius: number): string => {
  switch (shape) {
    case 'rectangle':
      return roundedRectPath(width, height, radius);
    case 'ellipse':
      return ellipsePath(width, height);
    case 'triangle':
      return polygonPath(
        [
          [0.5, 0],
          [1, 1],
          [0, 1],
        ],
        width,
        height,
      );
    case 'diamond':
      return polygonPath(
        [
          [0.5, 0],
          [1, 0.5],
          [0.5, 1],
          [0, 0.5],
        ],
        width,
        height,
      );
    case 'pentagon':
      return polygonPath(regularPolygon(5), width, height);
    case 'hexagon':
      return polygonPath(regularPolygon(6, 0), width, height);
    case 'star':
      return polygonPath(starPoints(5, 0.42), width, height);
    case 'arrow':
      return polygonPath(
        [
          [0, 0.3],
          [0.62, 0.3],
          [0.62, 0.06],
          [1, 0.5],
          [0.62, 0.94],
          [0.62, 0.7],
          [0, 0.7],
        ],
        width,
        height,
      );
    case 'speech':
      return polygonPath(
        [
          [0, 0],
          [1, 0],
          [1, 0.74],
          [0.36, 0.74],
          [0.16, 1],
          [0.2, 0.74],
          [0, 0.74],
        ],
        width,
        height,
      );
    case 'line':
      return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }
};

/** A line has no interior: it is drawn from its stroke alone. */
export const isStrokeOnly = (shape: ShapeKind): boolean => shape === 'line';
