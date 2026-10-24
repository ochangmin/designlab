import { describe, expect, it } from 'vitest';

import type { Design, Page } from '../src/domain/document.js';
import { expandGroups } from '../src/domain/document.js';
import { createShape, createText } from '../src/domain/elements.js';
import {
  alignElements,
  distributeElements,
  duplicateElements,
  groupElements,
  removeElements,
  reorder,
  updateElements,
} from '../src/domain/mutations.js';
import { SCHEMA_VERSION } from '../src/domain/document.js';

const makeDesign = (): Design => {
  const a = createShape('rectangle', { x: 0, y: 0, width: 100, height: 100 }, { name: 'A' });
  const b = createShape('ellipse', { x: 200, y: 0, width: 100, height: 100 }, { name: 'B' });
  const c = createText('C', { x: 500, y: 0, width: 100, height: 100 });
  const page: Page = {
    id: 'pg1',
    name: 'p',
    background: { kind: 'solid', color: '#fff' },
    elements: [a, b, c],
  };
  return {
    id: 'dsn1',
    schemaVersion: SCHEMA_VERSION,
    name: 'test',
    width: 1000,
    height: 1000,
    pages: [page],
    palette: [],
    createdAt: 0,
    updatedAt: 0,
  };
};

const idsOf = (design: Design): readonly string[] => (design.pages[0]?.elements ?? []).map((element) => element.id);

describe('reorder', () => {
  it('moves a selection to the front without reordering the rest', () => {
    const design = makeDesign();
    const first = idsOf(design)[0] ?? '';
    const next = reorder(design, 'pg1', [first], 'front');
    expect(idsOf(next)[2]).toBe(first);
  });

  it('steps one position forward', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const next = reorder(design, 'pg1', [ids[0] ?? ''], 'forward');
    expect(idsOf(next)).toEqual([ids[1], ids[0], ids[2]]);
  });

  it('leaves the order unchanged at the boundary', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const next = reorder(design, 'pg1', [ids[0] ?? ''], 'backward');
    expect(idsOf(next)).toEqual(ids);
  });
});

describe('updateElements', () => {
  it('skips locked elements unless asked to include them', () => {
    const design = makeDesign();
    const target = idsOf(design)[0] ?? '';
    const locked = updateElements(design, 'pg1', [target], () => ({ locked: true }), { includeLocked: true });
    const attempted = updateElements(locked, 'pg1', [target], () => ({ x: 999 }));
    expect(attempted.pages[0]?.elements[0]?.x).toBe(0);

    const forced = updateElements(locked, 'pg1', [target], () => ({ x: 999 }), { includeLocked: true });
    expect(forced.pages[0]?.elements[0]?.x).toBe(999);
  });

  it('does not mutate the input document', () => {
    const design = makeDesign();
    const target = idsOf(design)[0] ?? '';
    updateElements(design, 'pg1', [target], () => ({ x: 42 }));
    expect(design.pages[0]?.elements[0]?.x).toBe(0);
  });
});

describe('alignElements', () => {
  it('aligns a lone element to the page', () => {
    const design = makeDesign();
    const target = idsOf(design)[0] ?? '';
    const next = alignElements(design, 'pg1', [target], 'right');
    expect(next.pages[0]?.elements[0]?.x).toBe(900);
  });

  it('aligns a multi-selection to its own bounds', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const next = alignElements(design, 'pg1', [ids[0] ?? '', ids[1] ?? ''], 'right');
    expect(next.pages[0]?.elements[0]?.x).toBe(200);
    expect(next.pages[0]?.elements[1]?.x).toBe(200);
  });
});

describe('distributeElements', () => {
  it('spaces three elements evenly between the outer two', () => {
    const design = makeDesign();
    const next = distributeElements(design, 'pg1', idsOf(design), 'x');
    const xs = (next.pages[0]?.elements ?? []).map((element) => element.x);
    expect(xs[0]).toBe(0);
    expect(xs[2]).toBe(500);
    expect(xs[1]).toBe(250);
  });

  it('needs at least three elements to mean anything', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const next = distributeElements(design, 'pg1', [ids[0] ?? '', ids[1] ?? ''], 'x');
    expect(next).toBe(design);
  });
});

describe('grouping', () => {
  it('expands a selection to every member of the group', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const grouped = groupElements(design, 'pg1', [ids[0] ?? '', ids[1] ?? '']);
    const page = grouped.pages[0];
    expect(page).toBeDefined();
    if (!page) return;
    expect(expandGroups(page, [ids[0] ?? '']).length).toBe(2);
  });

  it('gives a duplicated group its own identity', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const grouped = groupElements(design, 'pg1', [ids[0] ?? '', ids[1] ?? '']);
    const outcome = duplicateElements(grouped, 'pg1', [ids[0] ?? '', ids[1] ?? '']);
    const elements = outcome.design.pages[0]?.elements ?? [];
    const original = elements.find((element) => element.id === ids[0])?.groupId;
    const copy = elements.find((element) => element.id === outcome.ids[0])?.groupId;
    expect(original).toBeTruthy();
    expect(copy).toBeTruthy();
    expect(copy).not.toBe(original);
  });
});

describe('removeElements', () => {
  it('removes only the named elements', () => {
    const design = makeDesign();
    const ids = idsOf(design);
    const next = removeElements(design, 'pg1', [ids[1] ?? '']);
    expect(idsOf(next)).toEqual([ids[0], ids[2]]);
  });
});
