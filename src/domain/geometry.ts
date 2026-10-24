/**
 * Pure geometry for the page coordinate space.
 *
 * One rule owns the relationship between a box and its rotation: a box is
 * stored as an axis-aligned `Rect` plus a rotation in degrees about its own
 * centre. Every consumer derives corners and bounds from here instead of
 * re-deriving them, so a rotated selection, a snap guide and an exported
 * frame always agree.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect extends Point, Size {}

/** The eight resize handles plus the rotation grip. */
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export const DEG = Math.PI / 180;

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

/** Round to a sane precision so stored documents stay stable and diffable. */
export const round = (value: number, places = 2): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export const centreOf = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

export const rotatePoint = (point: Point, origin: Point, degrees: number): Point => {
  if (degrees === 0) return point;
  const radians = degrees * DEG;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
};

/** Corners in draw order: nw, ne, se, sw — already rotated into page space. */
export const cornersOf = (rect: Rect, rotation: number): readonly Point[] => {
  const origin = centreOf(rect);
  const raw: Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  return raw.map((point) => rotatePoint(point, origin, rotation));
};

/** The axis-aligned bounds that contain a rotated box. */
export const boundsOf = (rect: Rect, rotation: number): Rect => {
  if (rotation === 0) return rect;
  const corners = cornersOf(rect, rotation);
  const xs = corners.map((corner) => corner.x);
  const ys = corners.map((corner) => corner.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
};

export const unionBounds = (rects: readonly Rect[]): Rect | null => {
  if (rects.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const rectsIntersect = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** Point-in-box test that accounts for the box's own rotation. */
export const containsPoint = (rect: Rect, rotation: number, point: Point): boolean => {
  const local = rotatePoint(point, centreOf(rect), -rotation);
  return (
    local.x >= rect.x &&
    local.x <= rect.x + rect.width &&
    local.y >= rect.y &&
    local.y <= rect.y + rect.height
  );
};

const HANDLE_AXES: Record<ResizeHandle, { readonly x: -1 | 0 | 1; readonly y: -1 | 0 | 1 }> = {
  nw: { x: -1, y: -1 },
  n: { x: 0, y: -1 },
  ne: { x: 1, y: -1 },
  e: { x: 1, y: 0 },
  se: { x: 1, y: 1 },
  s: { x: 0, y: 1 },
  sw: { x: -1, y: 1 },
  w: { x: -1, y: 0 },
};

export const handleAxes = (handle: ResizeHandle): { readonly x: number; readonly y: number } =>
  HANDLE_AXES[handle];

export interface ResizeRequest {
  readonly rect: Rect;
  readonly rotation: number;
  readonly handle: ResizeHandle;
  /** Pointer delta in page space, from the drag origin. */
  readonly delta: Point;
  readonly keepAspect: boolean;
  readonly minSize: number;
}

/**
 * Resize a rotated box by one handle while the opposite edge or corner stays
 * where it is on screen. The delta is taken into the box's own frame first, so
 * dragging the `e` handle of a box rotated 30° widens it along its own width.
 */
export const resizeRect = (request: ResizeRequest): Rect => {
  const { rect, rotation, handle, delta, keepAspect, minSize } = request;
  const axes = HANDLE_AXES[handle];
  const radians = rotation * DEG;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  // Pointer delta expressed in the box's unrotated frame.
  const localDx = delta.x * cos + delta.y * sin;
  const localDy = -delta.x * sin + delta.y * cos;

  let width = rect.width + localDx * axes.x;
  let height = rect.height + localDy * axes.y;

  if (keepAspect && axes.x !== 0 && axes.y !== 0 && rect.width > 0 && rect.height > 0) {
    const ratio = rect.width / rect.height;
    if (Math.abs(width - rect.width) > Math.abs(height - rect.height)) {
      height = width / ratio;
    } else {
      width = height * ratio;
    }
  }

  width = Math.max(minSize, width);
  height = Math.max(minSize, height);

  // Keep the anchor (the opposite corner/edge midpoint) fixed in page space.
  const anchorLocal: Point = {
    x: rect.x + ((1 - axes.x) / 2) * rect.width,
    y: rect.y + ((1 - axes.y) / 2) * rect.height,
  };
  const anchorPage = rotatePoint(anchorLocal, centreOf(rect), rotation);

  const grownRect: Rect = {
    x: axes.x < 0 ? rect.x + rect.width - width : rect.x,
    y: axes.y < 0 ? rect.y + rect.height - height : rect.y,
    width,
    height,
  };
  const grownAnchorLocal: Point = {
    x: grownRect.x + ((1 - axes.x) / 2) * grownRect.width,
    y: grownRect.y + ((1 - axes.y) / 2) * grownRect.height,
  };
  const grownAnchorPage = rotatePoint(grownAnchorLocal, centreOf(grownRect), rotation);

  return {
    x: round(grownRect.x + (anchorPage.x - grownAnchorPage.x)),
    y: round(grownRect.y + (anchorPage.y - grownAnchorPage.y)),
    width: round(width),
    height: round(height),
  };
};

/** Angle in degrees from `origin` to `point`, 0° pointing up. */
export const angleFrom = (origin: Point, point: Point): number => {
  const degrees = Math.atan2(point.y - origin.y, point.x - origin.x) / DEG + 90;
  return ((degrees % 360) + 360) % 360;
};

export const normaliseAngle = (degrees: number): number => {
  const wrapped = ((degrees % 360) + 360) % 360;
  return round(wrapped, 1);
};
