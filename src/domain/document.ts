/**
 * The design document: the one owner of what a design *is*.
 *
 * Every other layer reads these types; nothing outside this module invents a
 * second interpretation of an element. The model is deliberately flat — a page
 * holds an ordered list of elements and grouping is an attribute (`groupId`)
 * rather than a nested tree, so z-order, hit-testing and export all read the
 * same single sequence.
 */

export type DesignId = string;
export type PageId = string;
export type ElementId = string;
export type GroupId = string;

export const SCHEMA_VERSION = 1;

export interface Shadow {
  readonly enabled: boolean;
  readonly color: string;
  readonly blur: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

export type Paint =
  | { readonly kind: 'none' }
  | { readonly kind: 'solid'; readonly color: string }
  | { readonly kind: 'gradient'; readonly from: string; readonly to: string; readonly angle: number };

export interface Stroke {
  readonly color: string;
  readonly width: number;
  readonly dash: number;
}

export interface ImageFilters {
  readonly brightness: number;
  readonly contrast: number;
  readonly saturate: number;
  readonly blur: number;
  readonly grayscale: number;
}

export interface ElementBase {
  readonly id: ElementId;
  readonly name: string;
  /** Top-left corner in page units, before rotation. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Degrees clockwise about the element's own centre. */
  readonly rotation: number;
  readonly opacity: number;
  readonly locked: boolean;
  readonly hidden: boolean;
  /** Members of one group share a `groupId`; `null` means ungrouped. */
  readonly groupId: GroupId | null;
  readonly shadow: Shadow;
}

export type ShapeKind =
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'arrow'
  | 'line'
  | 'speech';

export interface ShapeElement extends ElementBase {
  readonly type: 'shape';
  readonly shape: ShapeKind;
  readonly fill: Paint;
  readonly stroke: Stroke;
  /** Corner radius in page units; only meaningful for `rectangle`. */
  readonly radius: number;
}

export type TextAlign = 'left' | 'center' | 'right';

export interface TextElement extends ElementBase {
  readonly type: 'text';
  readonly text: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fontWeight: number;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly color: string;
  readonly align: TextAlign;
  /** Multiplier of the font size. */
  readonly lineHeight: number;
  /** Extra tracking in page units. */
  readonly letterSpacing: number;
  readonly uppercase: boolean;
}

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface ImageElement extends ElementBase {
  readonly type: 'image';
  /** A data URL or an absolute URL. Kept verbatim; never rewritten. */
  readonly src: string;
  readonly fit: ImageFit;
  readonly radius: number;
  readonly filters: ImageFilters;
}

export interface IconElement extends ElementBase {
  readonly type: 'icon';
  /** SVG path data interpreted inside `viewBox`. */
  readonly pathData: string;
  readonly viewBox: number;
  readonly color: string;
}

export type DesignElement = ShapeElement | TextElement | ImageElement | IconElement;

export type ElementType = DesignElement['type'];

export interface Page {
  readonly id: PageId;
  readonly name: string;
  readonly background: Paint;
  /** Back to front. Index is z-order; nothing else encodes depth. */
  readonly elements: readonly DesignElement[];
}

export interface Design {
  readonly id: DesignId;
  readonly schemaVersion: number;
  readonly name: string;
  /** Page size in design units (treated as CSS px at 100%). */
  readonly width: number;
  readonly height: number;
  readonly pages: readonly Page[];
  readonly palette: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

export const findPage = (design: Design, pageId: PageId): Page | null =>
  design.pages.find((page) => page.id === pageId) ?? null;

export const findElement = (page: Page, elementId: ElementId): DesignElement | null =>
  page.elements.find((element) => element.id === elementId) ?? null;

export const locateElement = (
  design: Design,
  elementId: ElementId,
): { readonly page: Page; readonly element: DesignElement } | null => {
  for (const page of design.pages) {
    const element = findElement(page, elementId);
    if (element) return { page, element };
  }
  return null;
};

/** Every element sharing a group with any of `ids`, plus `ids` themselves. */
export const expandGroups = (page: Page, ids: readonly ElementId[]): readonly ElementId[] => {
  const groupIds = new Set<GroupId>();
  for (const id of ids) {
    const element = findElement(page, id);
    if (element?.groupId) groupIds.add(element.groupId);
  }
  if (groupIds.size === 0) return ids;
  const expanded = new Set<ElementId>(ids);
  for (const element of page.elements) {
    if (element.groupId && groupIds.has(element.groupId)) expanded.add(element.id);
  }
  return [...expanded];
};

export const paintToCss = (paint: Paint): string => {
  switch (paint.kind) {
    case 'none':
      return 'transparent';
    case 'solid':
      return paint.color;
    case 'gradient':
      return `linear-gradient(${paint.angle}deg, ${paint.from}, ${paint.to})`;
  }
};

export const isVisible = (element: DesignElement): boolean => !element.hidden && element.opacity > 0;
