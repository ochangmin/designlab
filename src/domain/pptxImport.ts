/**
 * PresentationML → DesignLab.
 *
 * The engine hands over DeckCraft's document model as JSON; this module is the
 * one place that interprets it. It is pure: media is resolved by an injected
 * lookup, so nothing here knows about WebAssembly or data URLs.
 *
 * Two shapes of loss are unavoidable and both are reported rather than hidden.
 * DesignLab's text element carries one typeface for the whole box, so a run
 * with its own size or weight is flattened to the first run's style. And a
 * slide can hold constructs this document has no equivalent for — tables,
 * charts, SmartArt — which are skipped by name.
 *
 * Field names below are the engine's own: camelCase, with enum variants
 * internally tagged by `type` or `kind`. Measurements arrive in points.
 */

import { round, type Rect } from './geometry.js';
import { createImage, createShape, createText } from './elements.js';
import { createId } from './ids.js';
import { err, ok, type Result } from './result.js';
import type { DocumentMalformed } from './errors.js';
import {
  SCHEMA_VERSION,
  type Design,
  type DesignElement,
  type Page,
  type Paint,
  type ShapeKind,
  type TextAlign,
} from './document.js';

/** PowerPoint measures in points; the document measures in CSS pixels. */
const PX_PER_PT = 4 / 3;

const px = (points: number): number => round(points * PX_PER_PT);

type Json = Record<string, unknown>;

const isRecord = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asArray = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const str = (value: unknown, fallback: string): string =>
  typeof value === 'string' ? value : fallback;

/** ECMA-376 preset geometries that DesignLab draws itself. */
const PRESET_SHAPES: Readonly<Record<string, ShapeKind>> = {
  rect: 'rectangle',
  roundRect: 'rectangle',
  snipRoundRect: 'rectangle',
  round1Rect: 'rectangle',
  round2SameRect: 'rectangle',
  ellipse: 'ellipse',
  triangle: 'triangle',
  rtTriangle: 'triangle',
  diamond: 'diamond',
  pentagon: 'pentagon',
  homePlate: 'pentagon',
  hexagon: 'hexagon',
  star5: 'star',
  star4: 'star',
  star6: 'star',
  star8: 'star',
  rightArrow: 'arrow',
  leftArrow: 'arrow',
  line: 'line',
  straightConnector1: 'line',
  wedgeRectCallout: 'speech',
  wedgeRoundRectCallout: 'speech',
  wedgeEllipseCallout: 'speech',
};

/** Theme slots, used when a colour refers to the scheme rather than a value. */
const SCHEME_FALLBACK: Readonly<Record<string, string>> = {
  dk1: '#111827',
  tx1: '#111827',
  dk2: '#1f2a53',
  tx2: '#1f2a53',
  lt1: '#ffffff',
  bg1: '#ffffff',
  lt2: '#f4f5ff',
  bg2: '#f4f5ff',
  accent1: '#6d5efc',
  accent2: '#f472b6',
  accent3: '#facc15',
  accent4: '#13a3b5',
  accent5: '#3f9a6a',
  accent6: '#ff9f68',
  hlink: '#6d5efc',
  folHlink: '#8a8a93',
};

const two = (value: number): string => Math.round(value).toString(16).padStart(2, '0');

/**
 * A colour in the engine's model: `{ base: { kind: 'rgb', rgb: {r,g,b,a} } }`
 * or `{ base: { kind: 'scheme', slot: 'accent1' } }`.
 */
const readColor = (value: unknown): string | null => {
  if (!isRecord(value)) return null;
  const base = isRecord(value['base']) ? value['base'] : value;
  const kind = base['kind'];

  if (kind === 'rgb' && isRecord(base['rgb'])) {
    const rgb = base['rgb'];
    const alpha = num(rgb['a'], 255);
    const hex = `#${two(num(rgb['r'], 0))}${two(num(rgb['g'], 0))}${two(num(rgb['b'], 0))}`;
    if (alpha >= 255) return hex;
    return `rgba(${Math.round(num(rgb['r'], 0))}, ${Math.round(num(rgb['g'], 0))}, ${Math.round(num(rgb['b'], 0))}, ${Number((alpha / 255).toFixed(3))})`;
  }

  if (kind === 'scheme') {
    // The theme's own palette is not resolved here; a recognisable stand-in
    // keeps the slide readable and the substitution is reported.
    return SCHEME_FALLBACK[str(base['slot'], '')] ?? null;
  }

  return null;
};

const readFill = (value: unknown): Paint | null => {
  if (!isRecord(value)) return null;
  const kind = value['kind'];

  if (kind === 'none') return { kind: 'none' };

  if (kind === 'solid') {
    const color = readColor(value['color']);
    return color === null ? null : { kind: 'solid', color };
  }

  if (kind === 'gradient') {
    const stops = asArray(value['stops'])
      .filter(isRecord)
      .map((stop) => ({ pos: num(stop['pos'], 0), color: readColor(stop['color']) }))
      .filter((stop): stop is { pos: number; color: string } => stop.color !== null)
      .sort((left, right) => left.pos - right.pos);
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!first || !last) return null;
    const shape = isRecord(value['shape']) ? value['shape'] : {};
    // DrawingML measures clockwise from "to the right"; CSS from "to the top".
    const angle = (num(shape['angle'], 0) + 90) % 360;
    return { kind: 'gradient', from: first.color, to: last.color, angle: round(angle, 1) };
  }

  return null;
};

interface Box extends Rect {
  readonly rotation: number;
}

const readXfrm = (value: unknown): Box | null => {
  if (!isRecord(value)) return null;
  return {
    x: px(num(value['x'], 0)),
    y: px(num(value['y'], 0)),
    width: Math.max(1, px(num(value['w'], 0))),
    height: Math.max(1, px(num(value['h'], 0))),
    rotation: round(num(value['rot'], 0), 1),
  };
};

interface FlatText {
  readonly text: string;
  readonly fontSize: number | null;
  readonly bold: boolean;
  readonly italic: boolean;
  readonly underline: boolean;
  readonly color: string | null;
  readonly fontFamily: string | null;
  /** True when runs disagreed and the first run's style was used for all. */
  readonly flattened: boolean;
}

/**
 * Collapse a text body to one string and one style. Paragraphs become lines;
 * the first run that carries a property decides it for the whole element.
 */
const readTextBody = (value: unknown): FlatText | null => {
  if (!isRecord(value)) return null;
  const paragraphs = asArray(value['paragraphs']).filter(isRecord);
  if (paragraphs.length === 0) return null;

  const lines: string[] = [];
  let first: Json | null = null;
  let distinct = false;

  for (const paragraph of paragraphs) {
    const runs = asArray(paragraph['runs']).filter(isRecord);
    lines.push(runs.map((run) => str(run['text'], '')).join(''));
    for (const run of runs) {
      const props = isRecord(run['props']) ? run['props'] : {};
      if (first === null) {
        first = props;
        continue;
      }
      if (props['size'] !== first['size'] || props['bold'] !== first['bold']) distinct = true;
    }
  }

  const text = lines.join('\n');
  if (text.trim() === '') return null;

  const props = first ?? {};
  const fontProps = isRecord(props['font']) ? props['font'] : null;
  return {
    text,
    fontSize: typeof props['size'] === 'number' ? px(props['size']) : null,
    bold: props['bold'] === true,
    italic: props['italic'] === true,
    underline: typeof props['underline'] === 'string' && props['underline'] !== 'none',
    color: readFill(props['fill'])?.kind === 'solid' ? readColor(props['fill']) : null,
    fontFamily: fontProps === null ? null : str(fontProps['typeface'] ?? fontProps['latin'], '') || null,
    flattened: distinct,
  };
};

const readAlign = (paragraphs: readonly unknown[]): TextAlign => {
  for (const paragraph of paragraphs) {
    if (!isRecord(paragraph)) continue;
    const props = isRecord(paragraph['props']) ? paragraph['props'] : {};
    const align = props['align'];
    if (align === 'ctr') return 'center';
    if (align === 'r') return 'right';
  }
  return 'left';
};

interface Context {
  /** Boxes inherited by placeholders, keyed by the layout's placeholder index. */
  readonly placeholders: ReadonlyMap<number, Box>;
  /** Resolves one media item, by its position in the model's `media` array. */
  readonly mediaUrl: (index: number) => string | null;
  readonly mediaIndexById: ReadonlyMap<number, number>;
  readonly notes: string[];
}

const noteOnce = (notes: string[], message: string): void => {
  if (!notes.includes(message)) notes.push(message);
};

const shapeKindOf = (geom: unknown): { readonly kind: ShapeKind; readonly rounded: boolean } => {
  const name = isRecord(geom) ? str(geom['name'], 'rect') : 'rect';
  return {
    kind: PRESET_SHAPES[name] ?? 'rectangle',
    rounded: name.toLowerCase().includes('round'),
  };
};

const mapShape = (shape: Json, context: Context): readonly DesignElement[] => {
  if (shape['hidden'] === true) return [];

  const kindValue = isRecord(shape['kind']) ? shape['kind'] : {};
  const type = str(kindValue['type'], 'shape');
  const placeholder = isRecord(shape['ph']) ? shape['ph'] : null;

  // A placeholder with no transform of its own inherits the layout's box.
  const inherited =
    placeholder === null ? null : (context.placeholders.get(num(placeholder['idx'], -1)) ?? null);
  const box = readXfrm(shape['xfrm']) ?? inherited;
  if (box === null) {
    noteOnce(context.notes, '레이아웃에서 위치를 찾지 못한 자리표시자는 건너뛰었습니다.');
    return [];
  }

  const name = str(shape['name'], '도형');
  const common = { rotation: box.rotation, name };

  if (type === 'group') {
    // Children live in their own coordinate space; map it onto the group's box.
    const child = readXfrm(kindValue['child']);
    const children = asArray(kindValue['children']).filter(isRecord);
    const scaleX = child && child.width > 0 ? box.width / child.width : 1;
    const scaleY = child && child.height > 0 ? box.height / child.height : 1;
    const groupId = createId('grp');
    return children
      .flatMap((member) => mapShape(member, context))
      .map((element) => ({
        ...element,
        x: round(box.x + (element.x - (child?.x ?? 0)) * scaleX),
        y: round(box.y + (element.y - (child?.y ?? 0)) * scaleY),
        width: Math.max(1, round(element.width * scaleX)),
        height: Math.max(1, round(element.height * scaleY)),
        groupId,
      }));
  }

  if (type === 'picture') {
    const fill = isRecord(kindValue['fill']) ? kindValue['fill'] : {};
    const mediaId = num(fill['media'], -1);
    const index = context.mediaIndexById.get(mediaId);
    const src = index === undefined ? null : context.mediaUrl(index);
    if (src === null) {
      noteOnce(context.notes, '일부 이미지는 파일에 포함되어 있지 않아(외부 링크) 가져오지 못했습니다.');
      return [];
    }
    return [createImage(src, box, { ...common, fit: 'fill' })];
  }

  if (type === 'table' || type === 'chart' || type === 'diagram' || type === 'opaque') {
    noteOnce(
      context.notes,
      `${type === 'table' ? '표' : type === 'chart' ? '차트' : 'SmartArt 등 일부 개체'}는 이 편집기에 대응하는 요소가 없어 건너뛰었습니다.`,
    );
    return [];
  }

  if (type === 'media' || type === 'model3d' || type === 'ink') {
    noteOnce(context.notes, '동영상·3D·잉크 개체는 건너뛰었습니다.');
    return [];
  }

  const elements: DesignElement[] = [];
  const fill = readFill(shape['fill']);
  const line = isRecord(shape['line']) ? shape['line'] : null;
  const strokeWidth = line === null ? 0 : px(num(line['width'], 0));
  const strokeColor = line === null ? null : readColor(isRecord(line['fill']) ? line['fill']['color'] : null);
  const geometry = shapeKindOf(shape['geom']);
  const isTextBox = shape['textBox'] === true;

  // A text box draws nothing of its own; anything else keeps its shape even
  // when it also carries text, so a filled callout still reads as a callout.
  const drawsShape = !isTextBox && (fill !== null || strokeWidth > 0 || type === 'connector');
  if (drawsShape) {
    elements.push(
      createShape(geometry.kind, box, {
        ...common,
        fill: fill ?? { kind: 'none' },
        stroke: {
          color: strokeColor ?? '#111827',
          width: strokeWidth,
          dash: line !== null && typeof line['dash'] === 'string' ? Math.max(4, strokeWidth * 2) : 0,
        },
        ...(geometry.rounded ? { radius: Math.round(Math.min(box.width, box.height) * 0.12) } : {}),
      }),
    );
  }

  const body = readTextBody(shape['text']);
  if (body !== null) {
    if (body.flattened) {
      noteOnce(
        context.notes,
        '한 상자 안에서 서체나 크기가 다른 부분은 첫 부분의 서식으로 통일했습니다.',
      );
    }
    const align = readAlign(asArray(isRecord(shape['text']) ? shape['text']['paragraphs'] : []));
    elements.push(
      createText(body.text, box, {
        ...common,
        align,
        fontSize: body.fontSize ?? Math.max(14, Math.round(box.height / 3)),
        fontWeight: body.bold ? 700 : 400,
        italic: body.italic,
        underline: body.underline,
        ...(body.color === null ? {} : { color: body.color }),
        ...(body.fontFamily === null ? {} : { fontFamily: body.fontFamily }),
      }),
    );
  }

  return elements;
};

/** Boxes the layout gives its placeholders, by placeholder index. */
const placeholdersOfLayout = (model: Json, layoutId: unknown): ReadonlyMap<number, Box> => {
  const boxes = new Map<number, Box>();
  for (const master of asArray(model['masters']).filter(isRecord)) {
    for (const layout of asArray(master['layouts']).filter(isRecord)) {
      if (layout['id'] !== layoutId) continue;
      for (const shape of asArray(layout['shapes']).filter(isRecord)) {
        const placeholder = isRecord(shape['ph']) ? shape['ph'] : null;
        const box = readXfrm(shape['xfrm']);
        if (placeholder === null || box === null) continue;
        boxes.set(num(placeholder['idx'], -1), box);
      }
    }
  }
  return boxes;
};

export interface PptxImportRequest {
  /** The engine's `Presentation`, already parsed from JSON. */
  readonly model: unknown;
  /** Resolves a media item to a URL by its index in the model's `media` array. */
  readonly mediaUrl: (index: number) => string | null;
  readonly name: string;
}

export interface PptxImportOutcome {
  readonly design: Design;
  /** What did not survive, phrased for the person who opened the file. */
  readonly notes: readonly string[];
}

export const designFromPresentation = (
  request: PptxImportRequest,
): Result<PptxImportOutcome, DocumentMalformed> => {
  const { model, mediaUrl, name } = request;
  if (!isRecord(model)) {
    return err({ kind: 'document-malformed', at: '$', detail: '발표 자료가 객체가 아닙니다.' });
  }

  const size = isRecord(model['slideSize']) ? model['slideSize'] : {};
  const width = px(num(size['width'], 720));
  const height = px(num(size['height'], 405));
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    return err({ kind: 'document-malformed', at: '$.slideSize', detail: '슬라이드 크기를 읽을 수 없습니다.' });
  }

  const slides = asArray(model['slides']).filter(isRecord);
  if (slides.length === 0) {
    return err({ kind: 'document-malformed', at: '$.slides', detail: '슬라이드가 하나도 없습니다.' });
  }

  // The model lists media in order; a picture names an id, so the index it sits
  // at is what the media lookup needs.
  const mediaIndexById = new Map<number, number>();
  asArray(model['media'])
    .filter(isRecord)
    .forEach((item, index) => {
      mediaIndexById.set(num(item['id'], -1), index);
    });

  const notes: string[] = [];
  const pages: Page[] = [];

  for (const [index, slide] of slides.entries()) {
    if (slide['hidden'] === true) {
      noteOnce(notes, '숨겨진 슬라이드도 페이지로 가져왔습니다.');
    }
    const context: Context = {
      placeholders: placeholdersOfLayout(model, slide['layout']),
      mediaUrl,
      mediaIndexById,
      notes,
    };
    const elements = asArray(slide['shapes'])
      .filter(isRecord)
      .flatMap((shape) => mapShape(shape, context));

    const background = readFill(isRecord(slide['background']) ? slide['background']['fill'] : null);
    pages.push({
      id: createId('pg'),
      name: str(slide['name'], '') || `슬라이드 ${index + 1}`,
      background: background ?? { kind: 'solid', color: '#ffffff' },
      elements,
    });
  }

  const now = Date.now();
  return ok({
    design: {
      id: createId('dsn'),
      schemaVersion: SCHEMA_VERSION,
      name,
      width,
      height,
      pages,
      palette: ['#111827', '#6d5efc', '#f472b6', '#facc15', '#ffffff'],
      createdAt: now,
      updatedAt: now,
    },
    notes,
  });
};

