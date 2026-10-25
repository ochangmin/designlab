import { describe, expect, it } from 'vitest';

import { designFromPresentation } from '../src/domain/pptxImport.js';

/** Shapes below mirror what the engine actually emits, captured from a real
 *  PowerPoint file: camelCase fields, points, `kind`/`type` tagging. */
const rgb = (r: number, g: number, b: number) => ({ base: { kind: 'rgb', rgb: { r, g, b, a: 255 } } });

const baseModel = (slides: unknown[], extra: Record<string, unknown> = {}) => ({
  slideSize: { width: 720, height: 405 },
  slides,
  masters: [],
  media: [],
  ...extra,
});

const shape = (overrides: Record<string, unknown>) => ({
  id: 2,
  name: '도형',
  kind: { type: 'shape' },
  geom: { kind: 'preset', name: 'rect' },
  xfrm: { x: 60, y: 30, w: 120, h: 60 },
  hidden: false,
  locked: false,
  textBox: false,
  ph: null,
  fill: null,
  line: null,
  text: null,
  ...overrides,
});

const slide = (shapes: unknown[], overrides: Record<string, unknown> = {}) => ({
  id: 256,
  layout: 13,
  name: '',
  shapes,
  background: null,
  hidden: false,
  ...overrides,
});

const open = (model: unknown, mediaUrl: (index: number) => string | null = () => null) =>
  designFromPresentation({ model, mediaUrl, name: '표본' });

describe('designFromPresentation', () => {
  it('converts the slide size from points to pixels', () => {
    const result = open(baseModel([slide([])]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.width).toBe(960);
    expect(result.value.design.height).toBe(540);
  });

  it('makes one page per slide and names an unnamed one', () => {
    const result = open(baseModel([slide([]), slide([], { name: '목차' })]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages.map((page) => page.name)).toEqual(['슬라이드 1', '목차']);
  });

  it('rejects a document with no slides', () => {
    const result = open(baseModel([]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.at).toBe('$.slides');
  });

  it('places a shape in pixels and keeps its rotation', () => {
    const result = open(
      baseModel([
        slide([shape({ xfrm: { x: 60, y: 30, w: 120, h: 60, rot: 15 }, fill: { kind: 'solid', color: rgb(109, 94, 252) } })]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const element = result.value.design.pages[0]?.elements[0];
    expect(element).toMatchObject({ type: 'shape', x: 80, y: 40, width: 160, height: 80, rotation: 15 });
    if (element?.type === 'shape') expect(element.fill).toEqual({ kind: 'solid', color: '#6d5efc' });
  });

  it('maps preset geometry onto the editor’s own shapes', () => {
    const presets = ['ellipse', 'triangle', 'diamond', 'star5', 'rightArrow', 'wedgeRectCallout', 'bentArrow'];
    const result = open(
      baseModel([
        slide(
          presets.map((name) =>
            shape({ geom: { kind: 'preset', name }, fill: { kind: 'solid', color: rgb(0, 0, 0) } }),
          ),
        ),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const kinds = (result.value.design.pages[0]?.elements ?? []).map((element) =>
      element.type === 'shape' ? element.shape : element.type,
    );
    // The unknown preset (`bentArrow`) falls back to a rectangle rather than
    // being dropped, so the slide keeps its composition.
    expect(kinds).toEqual(['ellipse', 'triangle', 'diamond', 'star', 'arrow', 'speech', 'rectangle']);
  });

  it('turns a DrawingML gradient into a CSS-angled one', () => {
    const result = open(
      baseModel([
        slide([
          shape({
            fill: {
              kind: 'gradient',
              shape: { kind: 'linear', angle: 90 },
              stops: [
                { pos: 1, color: rgb(255, 255, 255) },
                { pos: 0, color: rgb(17, 24, 39) },
              ],
            },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const element = result.value.design.pages[0]?.elements[0];
    if (element?.type !== 'shape') throw new Error('expected a shape');
    // Stops are read in position order, not document order.
    expect(element.fill).toEqual({ kind: 'gradient', from: '#111827', to: '#ffffff', angle: 180 });
  });

  it('substitutes a theme colour and says so', () => {
    const result = open(
      baseModel([slide([shape({ fill: { kind: 'solid', color: { base: { kind: 'scheme', slot: 'accent1' } } } })])]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const element = result.value.design.pages[0]?.elements[0];
    if (element?.type !== 'shape') throw new Error('expected a shape');
    expect(element.fill).toEqual({ kind: 'solid', color: '#6d5efc' });
  });

  it('joins paragraphs into lines and takes the first run’s style', () => {
    const result = open(
      baseModel([
        slide([
          shape({
            textBox: true,
            text: {
              body: {},
              paragraphs: [
                { level: 0, runs: [{ text: '첫 줄', props: { size: 24, bold: true } }] },
                { level: 0, runs: [{ text: '둘째 ', props: { size: 24, bold: true } }, { text: '줄', props: { size: 24, bold: true } }] },
              ],
            },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const element = result.value.design.pages[0]?.elements[0];
    if (element?.type !== 'text') throw new Error('expected text');
    expect(element.text).toBe('첫 줄\n둘째 줄');
    expect(element.fontSize).toBe(32);
    expect(element.fontWeight).toBe(700);
    expect(result.value.notes).toEqual([]);
  });

  it('reports when runs disagreed and were flattened', () => {
    const result = open(
      baseModel([
        slide([
          shape({
            textBox: true,
            text: {
              body: {},
              paragraphs: [
                { level: 0, runs: [{ text: 'a', props: { size: 18 } }, { text: 'b', props: { size: 40 } }] },
              ],
            },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.notes.join(' ')).toContain('첫 부분의 서식');
  });

  it('draws a text box without a shape behind it', () => {
    const result = open(
      baseModel([
        slide([
          shape({
            textBox: true,
            fill: { kind: 'solid', color: rgb(255, 0, 0) },
            text: { body: {}, paragraphs: [{ level: 0, runs: [{ text: '글', props: {} }] }] },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.value.design.pages[0]?.elements ?? []).map((e) => e.type)).toEqual(['text']);
  });

  it('keeps both the shape and its text for a filled callout', () => {
    const result = open(
      baseModel([
        slide([
          shape({
            fill: { kind: 'solid', color: rgb(255, 0, 0) },
            text: { body: {}, paragraphs: [{ level: 0, runs: [{ text: '글', props: {} }] }] },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.value.design.pages[0]?.elements ?? []).map((e) => e.type)).toEqual(['shape', 'text']);
  });

  it('takes a placeholder’s box from its layout', () => {
    const titleShape = shape({
      xfrm: null,
      ph: { idx: 0, kind: 'ctrTitle' },
      text: { body: {}, paragraphs: [{ level: 0, runs: [{ text: '제목', props: {} }] }] },
    });
    const model = baseModel([slide([titleShape])], {
      masters: [
        {
          layouts: [
            {
              id: 13,
              shapes: [{ ph: { idx: 0, kind: 'ctrTitle' }, xfrm: { x: 90, y: 66, w: 540, h: 141 } }],
            },
          ],
        },
      ],
    });
    const result = open(model);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.elements[0]).toMatchObject({ x: 120, y: 88, width: 720 });
  });

  it('skips a placeholder whose box cannot be resolved, and says so', () => {
    const result = open(baseModel([slide([shape({ xfrm: null, ph: { idx: 7, kind: 'body' } })])]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.elements).toEqual([]);
    expect(result.value.notes.join(' ')).toContain('자리표시자');
  });

  it('resolves a picture through the media array, by id', () => {
    const model = baseModel(
      [slide([shape({ kind: { type: 'picture', fill: { media: 9 } } })])],
      { media: [{ id: 8, contentType: 'image/png' }, { id: 9, contentType: 'image/jpeg' }] },
    );
    const result = open(model, (index) => (index === 1 ? 'data:image/jpeg;base64,AAAA' : null));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const element = result.value.design.pages[0]?.elements[0];
    if (element?.type !== 'image') throw new Error('expected an image');
    expect(element.src).toBe('data:image/jpeg;base64,AAAA');
  });

  it('reports a picture whose bytes are not in the package', () => {
    const model = baseModel([slide([shape({ kind: { type: 'picture', fill: { media: 9 } } })])], {
      media: [{ id: 9, contentType: 'image/png' }],
    });
    const result = open(model, () => null);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.elements).toEqual([]);
    expect(result.value.notes.join(' ')).toContain('외부 링크');
  });

  it('skips a table and names what it skipped', () => {
    const result = open(baseModel([slide([shape({ kind: { type: 'table' } })])]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.elements).toEqual([]);
    expect(result.value.notes.join(' ')).toContain('표');
  });

  it('omits a hidden shape', () => {
    const result = open(baseModel([slide([shape({ hidden: true, fill: { kind: 'solid', color: rgb(0, 0, 0) } })])]));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.elements).toEqual([]);
  });

  it('flattens a group into the page, keeping the members together', () => {
    const member = shape({ xfrm: { x: 0, y: 0, w: 100, h: 100 }, fill: { kind: 'solid', color: rgb(0, 0, 0) } });
    const result = open(
      baseModel([
        slide([
          shape({
            xfrm: { x: 100, y: 100, w: 200, h: 200 },
            kind: { type: 'group', children: [member], child: { x: 0, y: 0, w: 100, h: 100 } },
          }),
        ]),
      ]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const elements = result.value.design.pages[0]?.elements ?? [];
    expect(elements.length).toBe(1);
    // The child space is half the group's size, so the member doubles.
    expect(elements[0]).toMatchObject({ x: 133.33, y: 133.33, width: 266.67, height: 266.67 });
    expect(elements[0]?.groupId).toBeTruthy();
  });

  it('reads a slide background', () => {
    const result = open(
      baseModel([slide([], { background: { fill: { kind: 'solid', color: rgb(17, 34, 51) } } })]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.design.pages[0]?.background).toEqual({ kind: 'solid', color: '#112233' });
  });
});
