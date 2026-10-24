/**
 * Pure document edits.
 *
 * Every structural change to a design goes through one of these functions, so
 * the store never hand-edits arrays and undo/redo always captures a complete,
 * self-consistent document. Each function returns a new `Design`; the input is
 * never mutated.
 */

import { boundsOf, round, unionBounds, type Rect } from './geometry.js';
import { createId } from './ids.js';
import { cloneElement } from './elements.js';
import type {
  Design,
  DesignElement,
  ElementId,
  GroupId,
  Page,
  PageId,
  Paint,
} from './document.js';

const touch = (design: Design, pages: readonly Page[]): Design => ({
  ...design,
  pages,
  updatedAt: Date.now(),
});

const replacePage = (design: Design, pageId: PageId, map: (page: Page) => Page): Design =>
  touch(
    design,
    design.pages.map((page) => (page.id === pageId ? map(page) : page)),
  );

export const elementBounds = (element: DesignElement): Rect =>
  boundsOf(
    { x: element.x, y: element.y, width: element.width, height: element.height },
    element.rotation,
  );

export const selectionBounds = (page: Page, ids: readonly ElementId[]): Rect | null => {
  const idSet = new Set(ids);
  const rects = page.elements.filter((element) => idSet.has(element.id)).map(elementBounds);
  return unionBounds(rects);
};

export const addElements = (
  design: Design,
  pageId: PageId,
  elements: readonly DesignElement[],
): Design => replacePage(design, pageId, (page) => ({ ...page, elements: [...page.elements, ...elements] }));

/** Swap one element for another, keeping its place in the z-order. */
export const replaceElement = (
  design: Design,
  pageId: PageId,
  elementId: ElementId,
  replacement: DesignElement,
): Design =>
  replacePage(design, pageId, (page) => ({
    ...page,
    elements: page.elements.map((element) => (element.id === elementId ? replacement : element)),
  }));

export const removeElements = (design: Design, pageId: PageId, ids: readonly ElementId[]): Design => {
  const idSet = new Set(ids);
  return replacePage(design, pageId, (page) => ({
    ...page,
    elements: page.elements.filter((element) => !idSet.has(element.id)),
  }));
};

/**
 * Apply a per-element patch. The patch receives the current element so callers
 * can express relative moves without reading the document twice. Locked
 * elements are skipped unless `includeLocked` is set (the lock toggle itself).
 */
export const updateElements = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  patch: (element: DesignElement) => Partial<DesignElement>,
  options: { readonly includeLocked?: boolean } = {},
): Design => {
  const idSet = new Set(ids);
  return replacePage(design, pageId, (page) => ({
    ...page,
    elements: page.elements.map((element) => {
      if (!idSet.has(element.id)) return element;
      if (element.locked && options.includeLocked !== true) return element;
      return { ...element, ...patch(element) } as DesignElement;
    }),
  }));
};

export const moveBy = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  dx: number,
  dy: number,
): Design =>
  updateElements(design, pageId, ids, (element) => ({
    x: round(element.x + dx),
    y: round(element.y + dy),
  }));

export type ReorderIntent = 'front' | 'back' | 'forward' | 'backward';

export const reorder = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  intent: ReorderIntent,
): Design =>
  replacePage(design, pageId, (page) => {
    const idSet = new Set(ids);
    const moving = page.elements.filter((element) => idSet.has(element.id));
    if (moving.length === 0) return page;
    const rest = page.elements.filter((element) => !idSet.has(element.id));

    if (intent === 'front') return { ...page, elements: [...rest, ...moving] };
    if (intent === 'back') return { ...page, elements: [...moving, ...rest] };

    const next = [...page.elements];
    const indices = next
      .map((element, index) => ({ element, index }))
      .filter(({ element }) => idSet.has(element.id))
      .map(({ index }) => index);
    const ordered = intent === 'forward' ? [...indices].reverse() : indices;
    for (const index of ordered) {
      const target = intent === 'forward' ? index + 1 : index - 1;
      if (target < 0 || target >= next.length) continue;
      const current = next[index];
      const swap = next[target];
      if (!current || !swap) continue;
      if (idSet.has(swap.id)) continue;
      next[index] = swap;
      next[target] = current;
    }
    return { ...page, elements: next };
  });

export interface DuplicateOutcome {
  readonly design: Design;
  readonly ids: readonly ElementId[];
}

export const duplicateElements = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  offset = 24,
): DuplicateOutcome => {
  const page = design.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { design, ids: [] };
  const idSet = new Set(ids);
  const groupRemap = new Map<GroupId, GroupId>();
  const copies = page.elements
    .filter((element) => idSet.has(element.id))
    .map((element) => {
      const copy = cloneElement(element);
      let groupId = copy.groupId;
      if (groupId) {
        const remapped = groupRemap.get(groupId) ?? createId('grp');
        groupRemap.set(groupId, remapped);
        groupId = remapped;
      }
      return { ...copy, x: round(copy.x + offset), y: round(copy.y + offset), groupId } as DesignElement;
    });
  return {
    design: addElements(design, pageId, copies),
    ids: copies.map((element) => element.id),
  };
};

export const groupElements = (design: Design, pageId: PageId, ids: readonly ElementId[]): Design => {
  if (ids.length < 2) return design;
  const groupId = createId('grp');
  return updateElements(design, pageId, ids, () => ({ groupId }), { includeLocked: true });
};

export const ungroupElements = (design: Design, pageId: PageId, ids: readonly ElementId[]): Design =>
  updateElements(design, pageId, ids, () => ({ groupId: null }), { includeLocked: true });

export type AlignEdge = 'left' | 'centre-x' | 'right' | 'top' | 'centre-y' | 'bottom';

/**
 * Align to the selection's own bounds when more than one element is selected,
 * and to the page otherwise — the behaviour a single selected element implies.
 */
export const alignElements = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  edge: AlignEdge,
): Design => {
  const page = design.pages.find((candidate) => candidate.id === pageId);
  if (!page || ids.length === 0) return design;
  const frame: Rect =
    ids.length > 1
      ? (selectionBounds(page, ids) ?? { x: 0, y: 0, width: design.width, height: design.height })
      : { x: 0, y: 0, width: design.width, height: design.height };

  return updateElements(design, pageId, ids, (element) => {
    const bounds = elementBounds(element);
    const offsetX = element.x - bounds.x;
    const offsetY = element.y - bounds.y;
    switch (edge) {
      case 'left':
        return { x: round(frame.x + offsetX) };
      case 'centre-x':
        return { x: round(frame.x + (frame.width - bounds.width) / 2 + offsetX) };
      case 'right':
        return { x: round(frame.x + frame.width - bounds.width + offsetX) };
      case 'top':
        return { y: round(frame.y + offsetY) };
      case 'centre-y':
        return { y: round(frame.y + (frame.height - bounds.height) / 2 + offsetY) };
      case 'bottom':
        return { y: round(frame.y + frame.height - bounds.height + offsetY) };
    }
  });
};

export const distributeElements = (
  design: Design,
  pageId: PageId,
  ids: readonly ElementId[],
  axis: 'x' | 'y',
): Design => {
  const page = design.pages.find((candidate) => candidate.id === pageId);
  if (!page || ids.length < 3) return design;
  const idSet = new Set(ids);
  const entries = page.elements
    .filter((element) => idSet.has(element.id))
    .map((element) => ({ element, bounds: elementBounds(element) }))
    .sort((left, right) => (axis === 'x' ? left.bounds.x - right.bounds.x : left.bounds.y - right.bounds.y));

  const first = entries[0];
  const last = entries[entries.length - 1];
  if (!first || !last) return design;

  const span =
    axis === 'x'
      ? last.bounds.x + last.bounds.width - first.bounds.x
      : last.bounds.y + last.bounds.height - first.bounds.y;
  const occupied = entries.reduce(
    (total, entry) => total + (axis === 'x' ? entry.bounds.width : entry.bounds.height),
    0,
  );
  const gap = (span - occupied) / (entries.length - 1);

  let cursor = axis === 'x' ? first.bounds.x : first.bounds.y;
  const placements = new Map<ElementId, number>();
  for (const entry of entries) {
    placements.set(entry.element.id, cursor);
    cursor += (axis === 'x' ? entry.bounds.width : entry.bounds.height) + gap;
  }

  return updateElements(design, pageId, ids, (element) => {
    const target = placements.get(element.id);
    if (target === undefined) return {};
    const bounds = elementBounds(element);
    return axis === 'x'
      ? { x: round(target + (element.x - bounds.x)) }
      : { y: round(target + (element.y - bounds.y)) };
  });
};

export const createPage = (name: string, background: Paint): Page => ({
  id: createId('pg'),
  name,
  background,
  elements: [],
});

export const addPage = (design: Design, afterPageId: PageId | null): Design => {
  const index = afterPageId ? design.pages.findIndex((page) => page.id === afterPageId) : -1;
  const reference = index >= 0 ? design.pages[index] : design.pages[design.pages.length - 1];
  const page = createPage(`페이지 ${design.pages.length + 1}`, reference?.background ?? { kind: 'solid', color: '#ffffff' });
  const pages = [...design.pages];
  pages.splice(index >= 0 ? index + 1 : pages.length, 0, page);
  return touch(design, pages);
};

export const duplicatePage = (design: Design, pageId: PageId): Design => {
  const index = design.pages.findIndex((page) => page.id === pageId);
  const source = design.pages[index];
  if (!source) return design;
  const groupRemap = new Map<GroupId, GroupId>();
  const copy: Page = {
    id: createId('pg'),
    name: `${source.name} 사본`,
    background: source.background,
    elements: source.elements.map((element) => {
      const cloned = cloneElement(element);
      if (!cloned.groupId) return cloned;
      const remapped = groupRemap.get(cloned.groupId) ?? createId('grp');
      groupRemap.set(cloned.groupId, remapped);
      return { ...cloned, groupId: remapped } as DesignElement;
    }),
  };
  const pages = [...design.pages];
  pages.splice(index + 1, 0, copy);
  return touch(design, pages);
};

export const removePage = (design: Design, pageId: PageId): Design => {
  if (design.pages.length <= 1) return design;
  return touch(design, design.pages.filter((page) => page.id !== pageId));
};

export const movePage = (design: Design, pageId: PageId, direction: -1 | 1): Design => {
  const index = design.pages.findIndex((page) => page.id === pageId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= design.pages.length) return design;
  const pages = [...design.pages];
  const current = pages[index];
  const swap = pages[target];
  if (!current || !swap) return design;
  pages[index] = swap;
  pages[target] = current;
  return touch(design, pages);
};

export const setPageBackground = (design: Design, pageId: PageId, background: Paint): Design =>
  replacePage(design, pageId, (page) => ({ ...page, background }));

export const renamePage = (design: Design, pageId: PageId, name: string): Design =>
  replacePage(design, pageId, (page) => ({ ...page, name }));

export const resizeDesign = (design: Design, width: number, height: number): Design => ({
  ...design,
  width: Math.round(width),
  height: Math.round(height),
  updatedAt: Date.now(),
});

export const renameDesign = (design: Design, name: string): Design => ({
  ...design,
  name,
  updatedAt: Date.now(),
});

export const setPalette = (design: Design, palette: readonly string[]): Design => ({
  ...design,
  palette,
  updatedAt: Date.now(),
});
