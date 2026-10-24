/**
 * Raster rendering of a page.
 *
 * Export reads the same path data, the same line breaking and the same paint
 * rules as the on-screen editor, so a PNG is the document rather than an
 * approximation of the view. Images are loaded before the first stroke: a page
 * is drawn once, completely, or the failure is reported.
 */

import { paintToCss, type DesignElement, type Design, type ImageFilters, type Page, type Paint } from '../../domain/document.js';
import { DEG } from '../../domain/geometry.js';
import { isStrokeOnly, shapePath } from '../../domain/shapes.js';
import { layoutText, toFontShorthand, type MeasureText } from '../../domain/textLayout.js';
import { err, ok, type Result } from '../../domain/result.js';
import type { StudioError } from '../../domain/errors.js';

export interface RenderOptions {
  readonly scale: number;
  /** Painted under the page, for formats without an alpha channel. */
  readonly flattenTo?: string;
}

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

const collectImages = async (page: Page): Promise<Map<string, HTMLImageElement>> => {
  const sources = [
    ...new Set(page.elements.filter((element) => element.type === 'image').map((element) => element.src)),
  ];
  const loaded = await Promise.all(sources.map(async (src) => [src, await loadImage(src)] as const));
  const map = new Map<string, HTMLImageElement>();
  for (const [src, image] of loaded) {
    if (image) map.set(src, image);
  }
  return map;
};

const applyPaint = (
  context: CanvasRenderingContext2D,
  paint: Paint,
  width: number,
  height: number,
): string | CanvasGradient | null => {
  switch (paint.kind) {
    case 'none':
      return null;
    case 'solid':
      return paint.color;
    case 'gradient': {
      // CSS gradient angles run clockwise from "to top"; canvas gradients take
      // two points. One conversion, here, keeps editor and export identical.
      const radians = (paint.angle - 90) * DEG;
      const halfDiagonal = Math.hypot(width, height) / 2;
      const centreX = width / 2;
      const centreY = height / 2;
      const gradient = context.createLinearGradient(
        centreX - Math.cos(radians) * halfDiagonal,
        centreY - Math.sin(radians) * halfDiagonal,
        centreX + Math.cos(radians) * halfDiagonal,
        centreY + Math.sin(radians) * halfDiagonal,
      );
      gradient.addColorStop(0, paint.from);
      gradient.addColorStop(1, paint.to);
      return gradient;
    }
  }
};

const filterString = (filters: ImageFilters): string => {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.blur !== 0) parts.push(`blur(${filters.blur}px)`);
  if (filters.grayscale !== 0) parts.push(`grayscale(${filters.grayscale}%)`);
  return parts.length === 0 ? 'none' : parts.join(' ');
};

const coverRect = (
  image: HTMLImageElement,
  width: number,
  height: number,
  fit: 'cover' | 'contain' | 'fill',
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } => {
  if (fit === 'fill') return { x: 0, y: 0, width, height };
  const scale =
    fit === 'cover'
      ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
      : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  return { x: (width - drawWidth) / 2, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
};

const setLetterSpacing = (context: CanvasRenderingContext2D, spacing: number): void => {
  const target = context as unknown as Record<string, unknown>;
  if ('letterSpacing' in target) target['letterSpacing'] = `${spacing}px`;
};

const drawElement = (
  context: CanvasRenderingContext2D,
  element: DesignElement,
  images: Map<string, HTMLImageElement>,
  measure: MeasureText,
): void => {
  if (element.hidden || element.opacity === 0) return;

  context.save();
  context.globalAlpha = element.opacity;
  context.translate(element.x + element.width / 2, element.y + element.height / 2);
  context.rotate(element.rotation * DEG);
  context.translate(-element.width / 2, -element.height / 2);

  if (element.shadow.enabled) {
    context.shadowColor = element.shadow.color;
    context.shadowBlur = element.shadow.blur;
    context.shadowOffsetX = element.shadow.offsetX;
    context.shadowOffsetY = element.shadow.offsetY;
  }

  switch (element.type) {
    case 'shape': {
      const path = new Path2D(shapePath(element.shape, element.width, element.height, element.radius));
      if (!isStrokeOnly(element.shape)) {
        const fill = applyPaint(context, element.fill, element.width, element.height);
        if (fill !== null) {
          context.fillStyle = fill;
          context.fill(path);
        }
      }
      if (element.stroke.width > 0) {
        context.strokeStyle = element.stroke.color;
        context.lineWidth = element.stroke.width;
        context.lineCap = 'round';
        if (element.stroke.dash > 0) context.setLineDash([element.stroke.dash, element.stroke.dash * 1.4]);
        context.stroke(path);
      }
      break;
    }

    case 'icon': {
      const path = new Path2D(element.pathData);
      context.scale(element.width / element.viewBox, element.height / element.viewBox);
      context.fillStyle = element.color;
      context.fill(path);
      break;
    }

    case 'image': {
      const image = images.get(element.src);
      const path = new Path2D(shapePath('rectangle', element.width, element.height, element.radius));
      if (!image) {
        context.fillStyle = 'rgba(148, 163, 184, 0.35)';
        context.fill(path);
        break;
      }
      context.save();
      context.clip(path);
      context.filter = filterString(element.filters);
      const box = coverRect(image, element.width, element.height, element.fit);
      context.drawImage(image, box.x, box.y, box.width, box.height);
      context.restore();
      break;
    }

    case 'text': {
      const font = {
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        fontWeight: element.fontWeight,
        italic: element.italic,
        letterSpacing: element.letterSpacing,
        lineHeight: element.lineHeight,
      };
      const content = element.uppercase ? element.text.toLocaleUpperCase() : element.text;
      const layout = layoutText(content, element.width, font, measure);
      context.font = toFontShorthand(font);
      setLetterSpacing(context, element.letterSpacing);
      context.fillStyle = element.color;
      context.textBaseline = 'alphabetic';
      context.textAlign = element.align === 'center' ? 'center' : element.align === 'right' ? 'right' : 'left';
      const originX = element.align === 'center' ? element.width / 2 : element.align === 'right' ? element.width : 0;

      layout.lines.forEach((line, index) => {
        // Mirror the CSS box: half the leading above, then the ascent.
        const baseline =
          index * layout.lineHeightPx +
          (layout.lineHeightPx - element.fontSize) / 2 +
          element.fontSize * 0.8;
        context.fillText(line, originX, baseline);
        if (element.underline && line !== '') {
          const lineWidth = measure(line, font);
          const startX =
            element.align === 'center'
              ? (element.width - lineWidth) / 2
              : element.align === 'right'
                ? element.width - lineWidth
                : 0;
          context.fillRect(startX, baseline + element.fontSize * 0.12, lineWidth, Math.max(1, element.fontSize / 16));
        }
      });
      break;
    }
  }

  context.restore();
};

export const renderPageToCanvas = async (
  design: Design,
  page: Page,
  measure: MeasureText,
  options: RenderOptions,
): Promise<Result<HTMLCanvasElement, StudioError>> => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(design.width * options.scale));
  canvas.height = Math.max(1, Math.round(design.height * options.scale));
  const context = canvas.getContext('2d');
  if (!context) {
    return err({ kind: 'export-failed', format: 'raster', detail: '2D 컨텍스트를 만들 수 없습니다.' });
  }

  context.scale(options.scale, options.scale);

  if (options.flattenTo !== undefined) {
    context.fillStyle = options.flattenTo;
    context.fillRect(0, 0, design.width, design.height);
  }

  const background = applyPaint(context, page.background, design.width, design.height);
  if (background !== null) {
    context.fillStyle = background;
    context.fillRect(0, 0, design.width, design.height);
  }

  const images = await collectImages(page);
  for (const element of page.elements) {
    drawElement(context, element, images, measure);
    context.filter = 'none';
    context.setLineDash([]);
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
  }

  return ok(canvas);
};

/** Exposed for the template thumbnails, which need a CSS value, not a canvas. */
export const backgroundCss = (paint: Paint): string => paintToCss(paint);
