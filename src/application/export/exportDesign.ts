/**
 * Export workflows.
 *
 * Each function answers one request a person makes — "give me a PNG of this
 * page", "give me the whole document as a file" — and reports a `Result`
 * rather than failing silently. File naming is owned here so every format
 * lands with a consistent, recognisable name.
 */

import type { Design, Page } from '../../domain/document.js';
import type { StudioError } from '../../domain/errors.js';
import { err, ok, type Result } from '../../domain/result.js';
import type { MeasureText } from '../../domain/textLayout.js';
import { loadCraftEngine } from '../format/craftEngine.js';
import { buildPptx } from './pptxWriter.js';
import { renderPageToCanvas } from './rasterRenderer.js';
import { renderPageToSvg } from './svgRenderer.js';

export type RasterFormat = 'png' | 'jpeg';

const safeFileName = (name: string): string => {
  const trimmed = name.trim().replace(/[\\/:*?"<>|]+/g, '-');
  return trimmed === '' ? 'design' : trimmed.slice(0, 80);
};

const triggerDownload = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a tick to start the download before the URL is revoked.
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

const canvasToBlob = (canvas: HTMLCanvasElement, format: RasterFormat, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), `image/${format}`, quality);
  });

export interface RasterRequest {
  readonly design: Design;
  readonly page: Page;
  readonly measure: MeasureText;
  readonly format: RasterFormat;
  /** 1 renders at the document's own size; 2 doubles it. */
  readonly scale: number;
  readonly pageNumber: number;
}

export const exportRaster = async (request: RasterRequest): Promise<Result<void, StudioError>> => {
  const rendered = await renderPageToCanvas(request.design, request.page, request.measure, {
    scale: request.scale,
    ...(request.format === 'jpeg' ? { flattenTo: '#ffffff' } : {}),
  });
  if (!rendered.ok) return rendered;

  const blob = await canvasToBlob(rendered.value, request.format, request.format === 'jpeg' ? 0.92 : 1);
  if (!blob) {
    return err({ kind: 'export-failed', format: request.format.toUpperCase(), detail: '이미지 인코딩 실패' });
  }

  const suffix = request.design.pages.length > 1 ? `-${request.pageNumber}` : '';
  triggerDownload(blob, `${safeFileName(request.design.name)}${suffix}.${request.format === 'jpeg' ? 'jpg' : 'png'}`);
  return ok(undefined);
};

export const exportSvg = (design: Design, page: Page, measure: MeasureText, pageNumber: number): Result<void, StudioError> => {
  try {
    const markup = renderPageToSvg(design, page, measure);
    const suffix = design.pages.length > 1 ? `-${pageNumber}` : '';
    triggerDownload(new Blob([markup], { type: 'image/svg+xml' }), `${safeFileName(design.name)}${suffix}.svg`);
    return ok(undefined);
  } catch (cause) {
    return err({
      kind: 'export-failed',
      format: 'SVG',
      detail: cause instanceof Error ? cause.message : '알 수 없는 오류',
    });
  }
};

const PPTX_MEDIA_TYPE =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

/**
 * Write the whole document as a PowerPoint deck — one slide per page, with the
 * text still editable. This is always the complete document: a deck with one
 * slide missing is not a deck.
 */
export const exportPptx = async (
  design: Design,
  measure: MeasureText,
  scale: number,
): Promise<Result<void, StudioError>> => {
  const built = await buildPptx({ design, measure, scale });
  if (!built.ok) return built;
  triggerDownload(new Blob([built.value], { type: PPTX_MEDIA_TYPE }), `${safeFileName(design.name)}.pptx`);
  return ok(undefined);
};

export const exportJson = (design: Design): Result<void, StudioError> => {
  try {
    triggerDownload(
      new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }),
      `${safeFileName(design.name)}.designlab.json`,
    );
    return ok(undefined);
  } catch (cause) {
    return err({
      kind: 'export-failed',
      format: 'JSON',
      detail: cause instanceof Error ? cause.message : '알 수 없는 오류',
    });
  }
};

/**
 * Write the document as a real PDF.
 *
 * Each page is rendered the same way PNG export renders it, and the PDF is
 * assembled around those images by the format engine. The pages therefore have
 * exact point sizes and the file downloads like any other — no print dialog,
 * no "save as PDF" step. Needs the engine; `openPrintView` remains the path
 * for a build without one.
 */
export const exportPdf = async (
  design: Design,
  measure: MeasureText,
  scale: number,
): Promise<Result<void, StudioError>> => {
  const engine = await loadCraftEngine();
  if (!engine.ok) return engine;

  const builder = engine.value.newPdfBuilder();
  try {
    for (const page of design.pages) {
      // Flattened to white: a page with no background of its own would
      // otherwise arrive transparent, which a PDF reader shows as black.
      const rendered = await renderPageToCanvas(design, page, measure, {
        scale,
        flattenTo: '#ffffff',
      });
      if (!rendered.ok) return rendered;

      const blob = await canvasToBlob(rendered.value, 'png', 1);
      if (!blob) {
        return err({ kind: 'export-failed', format: 'PDF', detail: '페이지를 인코딩하지 못했습니다.' });
      }
      builder.addPage(new Uint8Array(await blob.arrayBuffer()));
    }

    // The engine divides pixels by the resolution to size each page, so this
    // is what makes one design pixel the 0.75 pt it stands for.
    const written = builder.finish(scale * 96);
    if (!written.ok) return written;

    triggerDownload(new Blob([written.value], { type: 'application/pdf' }), `${safeFileName(design.name)}.pdf`);
    return ok(undefined);
  } finally {
    builder.release();
  }
};

/**
 * Open a print view holding every page at its real size. The fallback for a
 * build without the format engine: the browser's own print dialog turns it
 * into a PDF, which keeps page sizes exact without shipping a PDF writer.
 */
export const openPrintView = async (
  design: Design,
  measure: MeasureText,
): Promise<Result<void, StudioError>> => {
  const rendered: string[] = [];
  for (const page of design.pages) {
    const canvas = await renderPageToCanvas(design, page, measure, { scale: 2, flattenTo: '#ffffff' });
    if (!canvas.ok) return canvas;
    rendered.push(canvas.value.toDataURL('image/png'));
  }

  const window_ = globalThis.open('', '_blank');
  if (!window_) {
    return err({
      kind: 'export-failed',
      format: 'PDF',
      detail: '팝업이 차단되었습니다. 이 사이트의 팝업을 허용해 주세요.',
    });
  }

  const pages = rendered
    .map((src) => `<section class="sheet"><img src="${src}" alt="" /></section>`)
    .join('');

  window_.document.write(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8" /><title>${safeFileName(design.name)}</title>` +
      `<style>
        @page { size: ${design.width}px ${design.height}px; margin: 0; }
        html, body { margin: 0; padding: 0; background: #e9e9ef; }
        .sheet { width: ${design.width}px; height: ${design.height}px; page-break-after: always; overflow: hidden; }
        .sheet img { display: block; width: 100%; height: 100%; }
        @media print { body { background: #fff; } }
      </style></head><body>${pages}` +
      '<script>window.addEventListener("load", () => window.print());</script>' +
      '</body></html>',
  );
  window_.document.close();
  return ok(undefined);
};
